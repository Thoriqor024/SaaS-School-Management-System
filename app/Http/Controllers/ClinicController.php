<?php

namespace App\Http\Controllers;

use App\Models\ClinicVisit;
use App\Models\Employee;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\MedicineDispense;
use App\Models\Student;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClinicController extends Controller
{
    public function visits(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $visits = ClinicVisit::query()
            ->visibleTo($user)
            ->with(['student:id,full_name,classroom', 'employee:id,full_name,position', 'attendant:id,full_name'])
            ->withCount('dispenses')
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('complaint', 'like', "%{$search}%")
                    ->orWhere('diagnosis', 'like', "%{$search}%")
                    ->orWhereHas('student', fn ($s) => $s->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('employee', fn ($e) => $e->where('full_name', 'like', "%{$search}%"));
            }))
            ->when($request->input('date'), fn ($q, $v) => $q->whereDate('visit_date', $v))
            ->when($request->input('disposition'), fn ($q, $v) => $q->where('disposition', $v))
            ->when($request->input('patient_type'), fn ($q, $v) => $q->where('patient_type', $v))
            ->latest('visit_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ClinicVisit $visit) => [
                'id' => $visit->id,
                'patient' => $visit->displayName(),
                'patient_type' => $visit->patient_type,
                'classroom' => $visit->student?->classroom,
                'visit_date' => $visit->visit_date?->toIso8601String(),
                'complaint' => $visit->complaint,
                'diagnosis' => $visit->diagnosis,
                'temperature' => $visit->temperature !== null ? (float) $visit->temperature : null,
                'disposition' => $visit->disposition,
                'attendant' => $visit->attendant?->full_name,
                'medicines' => $visit->dispenses_count,
            ]);

        $base = ClinicVisit::query()->visibleTo($user);

        return Inertia::render('Clinic/Visits', [
            'visits' => $visits,
            'medicines' => Medicine::query()->visibleTo($user)->where('stock', '>', 0)->orderBy('name')->get(['id', 'name', 'unit', 'stock']),
            'filters' => $request->only(['search', 'date', 'disposition', 'patient_type']),
            'dispositions' => ['returned_to_class', 'sent_home', 'referred_to_hospital', 'observation'],
            'counts' => [
                'today' => (clone $base)->whereDate('visit_date', Carbon::today())->count(),
                'week' => (clone $base)->where('visit_date', '>=', Carbon::today()->subDays(7))->count(),
                'month' => (clone $base)->whereMonth('visit_date', Carbon::today()->month)->count(),
                'referred' => (clone $base)->where('disposition', 'referred_to_hospital')->count(),
            ],
        ]);
    }

    public function createVisit(Request $request): Response
    {
        return Inertia::render('Clinic/VisitForm', [
            'visit' => null,
            ...$this->visitOptions($request),
        ]);
    }

    public function storeVisit(Request $request): RedirectResponse
    {
        $data = $this->validateVisit($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        ClinicVisit::create($data);

        return redirect()->route('clinic.visits.index')->with('success', 'Clinic visit was recorded.');
    }

    public function editVisit(Request $request, ClinicVisit $visit): Response
    {
        abort_unless($this->canSee($request, $visit), 403);

        return Inertia::render('Clinic/VisitForm', [
            'visit' => [
                ...$visit->only([
                    'id', 'school_id', 'branch_id', 'patient_type', 'student_id', 'employee_id',
                    'visit_date', 'complaint', 'temperature', 'blood_pressure', 'pulse', 'weight',
                    'height', 'diagnosis', 'treatment', 'disposition', 'attended_by_employee_id',
                    'follow_up_date', 'notes',
                ]),
                'visit_date' => $visit->visit_date?->format('Y-m-d\TH:i'),
                'follow_up_date' => $visit->follow_up_date?->toDateString(),
                'dispenses' => $visit->dispenses()->with('medicine:id,name,unit')->get()->map(fn ($d) => [
                    'id' => $d->id,
                    'medicine' => $d->medicine?->name,
                    'unit' => $d->medicine?->unit,
                    'quantity' => $d->quantity,
                    'dosage' => $d->dosage_instructions,
                    'dispensed_at' => $d->dispensed_at?->toIso8601String(),
                ]),
            ],
            ...$this->visitOptions($request),
        ]);
    }

    public function updateVisit(Request $request, ClinicVisit $visit): RedirectResponse
    {
        abort_unless($this->canSee($request, $visit), 403);

        $data = $this->validateVisit($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $visit->update($data);

        return redirect()->route('clinic.visits.index')->with('success', 'Clinic visit was updated.');
    }

    public function destroyVisit(Request $request, ClinicVisit $visit): RedirectResponse
    {
        abort_unless($this->canSee($request, $visit), 403);

        DB::transaction(function () use ($visit) {
            foreach ($visit->dispenses()->with('medicine')->get() as $dispense) {
                $dispense->medicine?->increment('stock', $dispense->quantity);
            }
            $visit->delete();
        });

        return redirect()->route('clinic.visits.index')->with('success', 'Clinic visit was deleted and dispensed stock restored.');
    }

    public function dispense(Request $request, ClinicVisit $visit): RedirectResponse
    {
        abort_unless($this->canSee($request, $visit), 403);

        $data = $request->validate([
            'medicine_id' => ['required', 'uuid', 'exists:medicines,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'dosage_instructions' => ['nullable', 'string', 'max:255'],
        ]);

        $medicine = Medicine::findOrFail($data['medicine_id']);
        $this->ensureRecordScope($request, $medicine->school_id);

        if ($medicine->stock < $data['quantity']) {
            return back()->with('error', 'Not enough stock of '.$medicine->name.' available.');
        }

        DB::transaction(function () use ($visit, $medicine, $data) {
            MedicineDispense::create([
                'clinic_visit_id' => $visit->id,
                'medicine_id' => $medicine->id,
                'quantity' => $data['quantity'],
                'dosage_instructions' => $data['dosage_instructions'] ?? null,
                'dispensed_at' => now(),
            ]);

            $medicine->decrement('stock', $data['quantity']);
        });

        return back()->with('success', 'Medicine issued to the patient.');
    }

    public function medicines(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $medicines = Medicine::query()
            ->visibleTo($user)
            ->with('branch:id,name')
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->input('low_stock'), fn ($q) => $q->whereColumn('stock', '<=', 'min_stock'))
            ->orderBy('name')
            ->get()
            ->map(fn (Medicine $medicine) => [
                ...$medicine->only(['id', 'school_id', 'branch_id', 'name', 'category', 'unit', 'stock', 'min_stock', 'expiry_date', 'batch_number', 'notes']),
                'branch' => $medicine->branch?->name,
                'is_low_stock' => $medicine->isLowStock(),
                'is_expired' => $medicine->expiry_date?->isPast() ?? false,
            ]);

        $base = Medicine::query()->visibleTo($user);

        return Inertia::render('Clinic/Medicines', [
            'medicines' => $medicines,
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['search', 'low_stock']),
            'counts' => [
                'total' => (clone $base)->count(),
                'low_stock' => (clone $base)->whereColumn('stock', '<=', 'min_stock')->count(),
                'out_of_stock' => (clone $base)->where('stock', '<=', 0)->count(),
                'expiring' => (clone $base)->whereNotNull('expiry_date')->whereDate('expiry_date', '<=', Carbon::today()->addDays(60))->count(),
            ],
        ]);
    }

    public function storeMedicine(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(['analgesic', 'antibiotic', 'antihistamine', 'vitamin', 'first_aid', 'other'])],
            'unit' => ['required', 'string', 'max:24'],
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'min_stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'expiry_date' => ['nullable', 'date'],
            'batch_number' => ['nullable', 'string', 'max:48'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        Medicine::create($data);

        return back()->with('success', $data['name'].' was added to the clinic inventory.');
    }

    public function updateMedicine(Request $request, Medicine $medicine): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(['analgesic', 'antibiotic', 'antihistamine', 'vitamin', 'first_aid', 'other'])],
            'unit' => ['required', 'string', 'max:24'],
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'min_stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'expiry_date' => ['nullable', 'date'],
            'batch_number' => ['nullable', 'string', 'max:48'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        $medicine->update($data);

        return back()->with('success', $medicine->name.' was updated.');
    }

    public function destroyMedicine(Request $request, Medicine $medicine): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $medicine->school_id === $request->user()->school_id, 403);

        $medicine->delete();

        return back()->with('success', 'Medicine was removed from the inventory.');
    }

    public function records(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $records = MedicalRecord::query()
            ->visibleTo($user)
            ->with(['student:id,full_name,classroom,nisn', 'employee:id,full_name,position', 'branch:id,name'])
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('allergies', 'like', "%{$search}%")
                    ->orWhere('chronic_conditions', 'like', "%{$search}%")
                    ->orWhereHas('student', fn ($s) => $s->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('employee', fn ($e) => $e->where('full_name', 'like', "%{$search}%"));
            }))
            ->when($request->input('patient_type'), fn ($q, $v) => $q->where('patient_type', $v))
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (MedicalRecord $record) => [
                'id' => $record->id,
                'patient' => $record->displayName(),
                'patient_type' => $record->patient_type,
                'student_id' => $record->student_id,
                'employee_id' => $record->employee_id,
                'classroom' => $record->student?->classroom,
                'blood_type' => $record->blood_type,
                'allergies' => $record->allergies,
                'chronic_conditions' => $record->chronic_conditions,
                'emergency_contact_name' => $record->emergency_contact_name,
                'emergency_contact_phone' => $record->emergency_contact_phone,
                'last_checkup_at' => $record->last_checkup_at?->toDateString(),
                'school_id' => $record->school_id,
                'branch_id' => $record->branch_id,
            ]);

        $base = MedicalRecord::query()->visibleTo($user);

        return Inertia::render('Clinic/Records', [
            'records' => $records,
            'students' => OptionLists::students($user),
            'employees' => OptionLists::employees($user),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['search', 'patient_type']),
            'counts' => [
                'total' => (clone $base)->count(),
                'students' => (clone $base)->where('patient_type', 'student')->count(),
                'employees' => (clone $base)->where('patient_type', 'employee')->count(),
                'with_allergies' => (clone $base)->whereNotNull('allergies')->where('allergies', '!=', '')->count(),
            ],
        ]);
    }

    public function storeRecord(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'patient_type' => ['required', Rule::in(['student', 'employee'])],
            'student_id' => ['nullable', 'uuid', 'exists:students,id'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'blood_type' => ['nullable', 'string', 'max:8'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'chronic_conditions' => ['nullable', 'string', 'max:1000'],
            'current_medications' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:32'],
            'insurance_provider' => ['nullable', 'string', 'max:80'],
            'insurance_number' => ['nullable', 'string', 'max:48'],
            'last_checkup_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        $personId = $data['patient_type'] === 'student' ? ($data['student_id'] ?? null) : ($data['employee_id'] ?? null);

        if (! $personId) {
            return back()->with('error', 'Select the patient for this medical record.');
        }

        $existing = MedicalRecord::where('patient_type', $data['patient_type'])
            ->when($data['patient_type'] === 'student', fn ($q) => $q->where('student_id', $personId))
            ->when($data['patient_type'] === 'employee', fn ($q) => $q->where('employee_id', $personId))
            ->first();

        if ($existing) {
            return back()->with('error', 'This person already has a medical record. Edit the existing record instead.');
        }

        MedicalRecord::create($data);

        return back()->with('success', 'Medical record was created.');
    }

    public function updateRecord(Request $request, MedicalRecord $record): RedirectResponse
    {
        $data = $request->validate([
            'blood_type' => ['nullable', 'string', 'max:8'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'chronic_conditions' => ['nullable', 'string', 'max:1000'],
            'current_medications' => ['nullable', 'string', 'max:1000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:32'],
            'insurance_provider' => ['nullable', 'string', 'max:80'],
            'insurance_number' => ['nullable', 'string', 'max:48'],
            'last_checkup_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->ensureRecordScope($request, $record->school_id);

        $record->update($data);

        return back()->with('success', 'Medical record was updated.');
    }

    public function destroyRecord(Request $request, MedicalRecord $record): RedirectResponse
    {
        abort_unless($request->user()->isSuperAdmin() || $record->school_id === $request->user()->school_id, 403);

        $record->delete();

        return back()->with('success', 'Medical record was deleted.');
    }

    protected function canSee(Request $request, ClinicVisit $visit): bool
    {
        $user = $request->user();

        return $user->isSuperAdmin() || ($user->school_id !== null && $visit->school_id === $user->school_id);
    }

    protected function visitOptions(Request $request): array
    {
        $user = $request->user();

        return [
            'students' => OptionLists::students($user),
            'employees' => OptionLists::employees($user),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'attendants' => OptionLists::employees($user),
            'dispositions' => ['returned_to_class', 'sent_home', 'referred_to_hospital', 'observation'],
        ];
    }

    protected function validateVisit(Request $request): array
    {
        return $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'patient_type' => ['required', Rule::in(['student', 'employee'])],
            'student_id' => ['nullable', 'uuid', 'exists:students,id'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'visit_date' => ['required', 'date'],
            'complaint' => ['required', 'string', 'max:255'],
            'temperature' => ['nullable', 'numeric', 'between:30,45'],
            'blood_pressure' => ['nullable', 'string', 'max:16'],
            'pulse' => ['nullable', 'integer', 'min:20', 'max:250'],
            'weight' => ['nullable', 'numeric', 'min:1', 'max:400'],
            'height' => ['nullable', 'numeric', 'min:20', 'max:300'],
            'diagnosis' => ['nullable', 'string', 'max:1000'],
            'treatment' => ['nullable', 'string', 'max:1000'],
            'disposition' => ['required', Rule::in(['returned_to_class', 'sent_home', 'referred_to_hospital', 'observation'])],
            'attended_by_employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'follow_up_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
