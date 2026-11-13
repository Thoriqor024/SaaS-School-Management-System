<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookLoan;
use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\Student;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LibraryController extends Controller
{
    public function members(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $members = LibraryMember::query()
            ->visibleTo($user)
            ->with(['student:id,full_name,nisn,classroom', 'employee:id,full_name,position', 'branch:id,name'])
            ->withCount(['activeLoans'])
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('member_code', 'like', "%{$search}%")
                    ->orWhereHas('student', fn ($s) => $s->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('employee', fn ($e) => $e->where('full_name', 'like', "%{$search}%"));
            }))
            ->when($request->input('member_type'), fn ($q, $v) => $q->where('member_type', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (LibraryMember $member) => [
                'id' => $member->id,
                'member_code' => $member->member_code,
                'member_type' => $member->member_type,
                'name' => $member->displayName(),
                'identity' => $member->student?->nisn ?? $member->employee?->position,
                'classroom' => $member->student?->classroom,
                'branch' => $member->branch?->name,
                'joined_at' => $member->joined_at?->toDateString(),
                'expires_at' => $member->expires_at?->toDateString(),
                'max_loans' => $member->max_loans,
                'status' => $member->status,
                'active_loans' => $member->active_loans_count,
            ]);

        $base = LibraryMember::query()->visibleTo($user);

        return Inertia::render('Library/Members', [
            'members' => $members,
            'students' => OptionLists::students($user),
            'employees' => OptionLists::employees($user),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['search', 'member_type', 'status']),
            'counts' => [
                'total' => (clone $base)->count(),
                'students' => (clone $base)->where('member_type', 'student')->count(),
                'employees' => (clone $base)->where('member_type', 'employee')->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
            ],
        ]);
    }

    public function storeMember(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'member_type' => ['required', Rule::in(['student', 'employee'])],
            'student_id' => ['nullable', 'uuid', 'exists:students,id'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'joined_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:joined_at'],
            'max_loans' => ['required', 'integer', 'min:1', 'max:20'],
            'status' => ['required', Rule::in(['active', 'suspended', 'expired'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);

        $personId = $data['member_type'] === 'student' ? ($data['student_id'] ?? null) : ($data['employee_id'] ?? null);

        if (! $personId) {
            return back()->with('error', 'Select the person this membership belongs to.');
        }

        if (LibraryMember::where('member_type', $data['member_type'])
            ->when($data['member_type'] === 'student', fn ($q) => $q->where('student_id', $personId))
            ->when($data['member_type'] === 'employee', fn ($q) => $q->where('employee_id', $personId))
            ->exists()) {
            return back()->with('error', 'This person already has a library membership.');
        }

        LibraryMember::create([
            ...$data,
            'member_code' => 'LIB-'.strtoupper(Str::random(6)),
            'joined_at' => $data['joined_at'] ?? now()->toDateString(),
        ]);

        return back()->with('success', 'Library membership was registered.');
    }

    public function updateMember(Request $request, LibraryMember $member): RedirectResponse
    {
        $data = $request->validate([
            'expires_at' => ['nullable', 'date'],
            'max_loans' => ['required', 'integer', 'min:1', 'max:20'],
            'status' => ['required', Rule::in(['active', 'suspended', 'expired'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureRecordScope($request, $member->school_id);

        $member->update($data);

        return back()->with('success', 'Membership was updated.');
    }

    public function destroyMember(Request $request, LibraryMember $member): RedirectResponse
    {
        abort_unless($this->canAccess($request, $member->school_id), 403);

        if ($member->activeLoans()->exists()) {
            return back()->with('error', 'This member still has books on loan.');
        }

        $member->delete();

        return back()->with('success', 'Membership was deleted.');
    }

    public function loans(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $loans = BookLoan::query()
            ->visibleTo($user)
            ->with([
                'book:id,title,barcode,author',
                'member:id,member_code,member_type,student_id,employee_id',
                'member.student:id,full_name',
                'member.employee:id,full_name',
            ])
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->whereHas('book', fn ($b) => $b->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('member', fn ($m) => $m->where('member_code', 'like', "%{$search}%")
                        ->orWhereHas('student', fn ($s) => $s->where('full_name', 'like', "%{$search}%"))
                        ->orWhereHas('employee', fn ($e) => $e->where('full_name', 'like', "%{$search}%")));
            }))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('overdue'), fn ($q) => $q->whereIn('status', ['borrowed', 'overdue'])->whereDate('due_at', '<', Carbon::today()))
            ->latest('borrowed_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (BookLoan $loan) => [
                'id' => $loan->id,
                'book' => $loan->book?->title,
                'barcode' => $loan->book?->barcode,
                'member' => $loan->member?->displayName(),
                'member_code' => $loan->member?->member_code,
                'member_type' => $loan->member?->member_type,
                'borrowed_at' => $loan->borrowed_at?->toDateString(),
                'due_at' => $loan->due_at?->toDateString(),
                'returned_at' => $loan->returned_at?->toDateString(),
                'status' => $loan->isOverdue() ? 'overdue' : $loan->status,
                'notes' => $loan->notes,
            ]);

        $base = BookLoan::query()->visibleTo($user);

        return Inertia::render('Library/Loans', [
            'loans' => $loans,
            'books' => Book::query()->visibleTo($user)->where('available_copies', '>', 0)->orderBy('title')->get(['id', 'title', 'barcode', 'available_copies']),
            'members' => LibraryMember::query()->visibleTo($user)->with(['student:id,full_name', 'employee:id,full_name'])->where('status', 'active')->get()
                ->map(fn (LibraryMember $member) => [
                    'id' => $member->id,
                    'label' => $member->displayName().' ('.$member->member_code.')',
                    'max_loans' => $member->max_loans,
                    'active_loans' => $member->activeLoans()->count(),
                ]),
            'filters' => $request->only(['search', 'status', 'overdue']),
            'statuses' => ['borrowed', 'returned', 'lost'],
            'counts' => [
                'active' => (clone $base)->whereIn('status', ['borrowed', 'overdue'])->count(),
                'overdue' => (clone $base)->whereIn('status', ['borrowed', 'overdue'])->whereDate('due_at', '<', Carbon::today())->count(),
                'returned_this_month' => (clone $base)->whereNotNull('returned_at')->whereMonth('returned_at', Carbon::today()->month)->count(),
                'total' => (clone $base)->count(),
            ],
        ]);
    }

    public function storeLoan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'book_id' => ['required', 'uuid', 'exists:books,id'],
            'library_member_id' => ['required', 'uuid', 'exists:library_members,id'],
            'borrowed_at' => ['required', 'date'],
            'due_at' => ['required', 'date', 'after_or_equal:borrowed_at'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $book = Book::findOrFail($data['book_id']);
        $member = LibraryMember::with('activeLoans')->findOrFail($data['library_member_id']);

        $this->ensureRecordScope($request, $book->school_id);

        if ($member->school_id !== $book->school_id) {
            return back()->with('error', 'This membership belongs to a different school than the book.');
        }

        if ($member->status !== 'active') {
            return back()->with('error', 'This membership is not active.');
        }

        if ($book->available_copies < 1) {
            return back()->with('error', 'No copies of this book are available right now.');
        }

        if ($member->activeLoans->count() >= $member->max_loans) {
            return back()->with('error', 'This member has reached the maximum number of concurrent loans.');
        }

        $book->decrement('available_copies');

        BookLoan::create([
            ...$data,
            'school_id' => $book->school_id,
            'status' => 'borrowed',
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Book issued to '.$member->displayName().'.');
    }

    public function returnLoan(Request $request, BookLoan $loan): RedirectResponse
    {
        abort_unless($this->canAccess($request, $loan->school_id), 403);

        if ($loan->status === 'returned') {
            return back()->with('error', 'This loan has already been returned.');
        }

        $loan->update([
            'returned_at' => Carbon::today(),
            'status' => 'returned',
        ]);

        $loan->book?->increment('available_copies');

        return back()->with('success', 'Book marked as returned.');
    }

    public function destroyLoan(Request $request, BookLoan $loan): RedirectResponse
    {
        abort_unless($this->canAccess($request, $loan->school_id), 403);

        if ($loan->status !== 'returned') {
            $loan->book?->increment('available_copies');
        }

        $loan->delete();

        return back()->with('success', 'Loan record was deleted.');
    }
}
