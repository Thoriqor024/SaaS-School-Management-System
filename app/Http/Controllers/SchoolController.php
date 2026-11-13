<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $schools = School::query()
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->where('id', $user->school_id))
            ->withCount(['branches', 'students', 'employees'])
            ->orderBy('name')
            ->get()
            ->map(fn (School $school) => [
                ...$school->only(['id', 'name', 'code', 'npsn', 'level', 'email', 'phone', 'address', 'city', 'province', 'headmaster_name', 'logo_color', 'is_active']),
                'initials' => $school->initials(),
                'branches_count' => $school->branches_count,
                'students_count' => $school->students_count,
                'employees_count' => $school->employees_count,
                'branches' => $school->branches()->orderBy('name')->get()->map(fn (Branch $branch) => [
                    ...$branch->only(['id', 'name', 'code', 'type', 'email', 'phone', 'address', 'city', 'head_name', 'is_active']),
                    'students_count' => $branch->students()->count(),
                    'employees_count' => $branch->employees()->count(),
                ]),
            ]);

        return Inertia::render('Schools/Index', [
            'schools' => $schools,
            'canManage' => $user->hasPermission('schools.manage'),
            'totals' => [
                'schools' => $schools->count(),
                'branches' => $schools->sum(fn ($s) => $s['branches']->count()),
                'students' => $schools->sum('students_count'),
                'employees' => $schools->sum('employees_count'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:32', 'unique:schools,code'],
            'npsn' => ['nullable', 'string', 'max:32'],
            'level' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:64'],
            'province' => ['nullable', 'string', 'max:64'],
            'headmaster_name' => ['nullable', 'string', 'max:120'],
            'is_active' => ['boolean'],
        ]);

        $data['logo_color'] = collect(['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet'])->random();
        School::create($data);

        return back()->with('success', 'School was created.');
    }

    public function update(Request $request, School $school): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:32', Rule::unique('schools', 'code')->ignore($school->id)],
            'npsn' => ['nullable', 'string', 'max:32'],
            'level' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:64'],
            'province' => ['nullable', 'string', 'max:64'],
            'headmaster_name' => ['nullable', 'string', 'max:120'],
            'is_active' => ['boolean'],
        ]);

        $school->update($data);

        return back()->with('success', $school->name.' was updated.');
    }

    public function destroy(Request $request, School $school): RedirectResponse
    {
        if ($school->students()->exists()) {
            return back()->with('error', 'Move or remove the school\'s students before deleting it.');
        }

        $school->delete();

        return back()->with('success', 'School was deleted.');
    }

    public function storeBranch(Request $request, School $school): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:32', Rule::unique('branches', 'code')->where('school_id', $school->id)],
            'type' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:64'],
            'province' => ['nullable', 'string', 'max:64'],
            'head_name' => ['nullable', 'string', 'max:120'],
            'is_active' => ['boolean'],
        ]);

        $school->branches()->create($data);

        return back()->with('success', 'Branch was added to '.$school->name.'.');
    }

    public function updateBranch(Request $request, Branch $branch): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:32', Rule::unique('branches', 'code')->where('school_id', $branch->school_id)->ignore($branch->id)],
            'type' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:64'],
            'province' => ['nullable', 'string', 'max:64'],
            'head_name' => ['nullable', 'string', 'max:120'],
            'is_active' => ['boolean'],
        ]);

        $branch->update($data);

        return back()->with('success', $branch->name.' was updated.');
    }

    public function destroyBranch(Branch $branch): RedirectResponse
    {
        if ($branch->students()->exists()) {
            return back()->with('error', 'This branch still has students assigned to it.');
        }

        $branch->delete();

        return back()->with('success', 'Branch was deleted.');
    }
}
