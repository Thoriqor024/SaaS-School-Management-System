<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesPhotos;
use App\Models\Student;
use App\Support\Media;
use App\Support\OptionLists;
use App\Support\StudentRules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    use HandlesPhotos;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $students = Student::query()
            ->visibleTo($user)
            ->with(['school:id,name', 'branch:id,name'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nis', 'like', "%{$search}%")
                        ->orWhere('classroom', 'like', "%{$search}%")
                        ->orWhere('guardian_name', 'like', "%{$search}%");
                });
            })
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->when($request->input('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->when($request->input('grade_level'), fn ($q, $v) => $q->where('grade_level', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->orderBy('full_name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Student $student) => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nis' => $student->nis,
                'full_name' => $student->full_name,
                'gender' => $student->gender,
                'grade_level' => $student->grade_level,
                'classroom' => $student->classroom,
                'status' => $student->status,
                'guardian_name' => $student->guardian_name,
                'guardian_phone' => $student->guardian_phone,
                'school' => $student->school?->name,
                'branch' => $student->branch?->name,
                'age' => $student->age(),
                'avatar_color' => $student->school?->logo_color,
            ]);

        return Inertia::render('Students/Index', [
            'students' => $students,
            'filters' => $request->only(['search', 'school_id', 'branch_id', 'grade_level', 'status']),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'gradeLevels' => $this->gradeLevels(),
            'statuses' => ['active', 'inactive', 'graduated', 'transferred'],
            'counts' => [
                'total' => Student::query()->visibleTo($user)->count(),
                'active' => Student::query()->visibleTo($user)->where('status', 'active')->count(),
                'male' => Student::query()->visibleTo($user)->where('gender', 'male')->count(),
                'female' => Student::query()->visibleTo($user)->where('gender', 'female')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Students/Form', [
            'student' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $photo = $this->resolvePhoto($request, null, 'photos/students');
        unset($data['photo'], $data['remove_photo']);
        $student = Student::create([...$data, 'photo_path' => $photo]);

        return redirect()->route('students.show', $student)->with('success', $student->full_name.' was added to the global student database.');
    }

    public function show(Request $request, Student $student): Response
    {
        abort_unless($this->canSee($request, $student), 403);

        $student->load([
            'school:id,name,code', 'branch:id,name',
            'medicalRecord',
            'activeRoute.route',
            'libraryMembers.loans.book:id,title',
            'clinicVisits' => fn ($q) => $q->latest('visit_date')->limit(5),
        ]);

        $visits = $student->clinicVisits->map(fn ($visit) => [
            'id' => $visit->id,
            'visit_date' => $visit->visit_date?->toIso8601String(),
            'complaint' => $visit->complaint,
            'diagnosis' => $visit->diagnosis,
            'disposition' => $visit->disposition,
        ]);

        $loans = $student->libraryMembers->flatMap->loans->map(fn ($loan) => [
            'id' => $loan->id,
            'book' => $loan->book?->title,
            'borrowed_at' => $loan->borrowed_at?->toDateString(),
            'due_at' => $loan->due_at?->toDateString(),
            'status' => $loan->status,
        ])->values();

        return Inertia::render('Students/Show', [
            'student' => [
                ...$student->only([
                    'id', 'nisn', 'nis', 'full_name', 'nickname', 'gender', 'birth_place',
                    'birth_date', 'religion', 'blood_type', 'grade_level', 'classroom',
                    'enrollment_year', 'admission_date', 'status', 'email', 'phone', 'address',
                    'guardian_name', 'guardian_relation', 'guardian_phone', 'guardian_email',
                    'guardian_occupation', 'notes', 'photo_path',
                ]),
                'age' => $student->age(),
                'school' => $student->school,
                'branch' => $student->branch,
                'medical_record' => $student->medicalRecord,
                'route' => $student->activeRoute?->route?->only(['id', 'name', 'code']),
                'photo_url' => Media::photoUrl($student->photo_path),
            ],
            'visits' => $visits,
            'loans' => $loans,
        ]);
    }

    public function edit(Request $request, Student $student): Response
    {
        abort_unless($this->canSee($request, $student), 403);

        return Inertia::render('Students/Form', [
            'student' => $student,
            ...$this->formOptions($request),
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        abort_unless($this->canSee($request, $student), 403);

        $data = $this->validated($request, $student);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $data['photo_path'] = $this->resolvePhoto($request, $student->photo_path, 'photos/students');
        unset($data['photo'], $data['remove_photo']);
        $student->update($data);

        return redirect()->route('students.show', $student)->with('success', $student->full_name.' was updated.');
    }

    public function destroy(Request $request, Student $student): RedirectResponse
    {
        abort_unless($this->canSee($request, $student), 403);

        $name = $student->full_name;
        $student->delete();

        return redirect()->route('students.index')->with('success', $name.' was removed from the student database.');
    }

    protected function canSee(Request $request, Student $student): bool
    {
        $user = $request->user();

        return $user->isSuperAdmin() || ($user->school_id !== null && $student->school_id === $user->school_id);
    }

    protected function gradeLevels(): array
    {
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    }

    protected function formOptions(Request $request): array
    {
        $user = $request->user();

        return [
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'gradeLevels' => $this->gradeLevels(),
            'statuses' => ['active', 'inactive', 'graduated', 'transferred'],
        ];
    }

    protected function validated(Request $request, ?Student $student = null): array
    {
        return $request->validate(StudentRules::rules($student));
    }
}
