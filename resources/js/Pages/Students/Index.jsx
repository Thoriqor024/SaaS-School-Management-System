import { Link, router } from '@inertiajs/react';
import { Download, Eye, GraduationCap, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    DataTable,
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    Select,
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatNumber } from '../../lib/format';

export default function StudentsIndex({ students, filters, schools, branches, gradeLevels, statuses, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (overrides = {}) => {
        router.get(
            '/students',
            { ...filters, search, ...overrides },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((filters.search ?? '') !== search) apply({ search });
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const columns = [
        {
            key: 'full_name',
            label: 'Student',
            render: (student) => (
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-700">
                        {student.full_name?.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{student.full_name}</p>
                        <p className="truncate text-[11px] text-slate-500">
                            {student.nisn ? `NISN ${student.nisn}` : 'No NISN'} {student.age ? `· ${student.age} yrs` : ''}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'classroom',
            label: 'Class',
            render: (student) => (
                <div>
                    <p className="font-medium text-slate-700">{student.classroom || '—'}</p>
                    <p className="text-[11px] text-slate-500">Grade {student.grade_level || '—'}</p>
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'School / branch',
            render: (student) => (
                <div>
                    <p className="text-slate-700">{student.school || '—'}</p>
                    <p className="text-[11px] text-slate-500">{student.branch || 'No branch'}</p>
                </div>
            ),
        },
        {
            key: 'guardian_name',
            label: 'Guardian',
            render: (student) => (
                <div>
                    <p className="text-slate-700">{student.guardian_name || '—'}</p>
                    <p className="text-[11px] text-slate-500">{student.guardian_phone || ''}</p>
                </div>
            ),
        },
        {
            key: 'gender',
            label: 'Gender',
            render: (student) => <span className="capitalize text-slate-600">{student.gender}</span>,
        },
        { key: 'status', label: 'Status', render: (student) => <StatusBadge value={student.status} /> },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (student) => (
                <div className="flex items-center justify-end gap-1">
                    <Link
                        href={`/students/${student.id}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        title="View profile"
                    >
                        <Eye className="h-4 w-4" />
                    </Link>
                    {can('students.manage') && (
                        <>
                            <Link
                                href={`/students/${student.id}/edit`}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                                title="Edit student"
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => confirmDelete(`/students/${student.id}`, `Remove ${student.full_name} from the database?`)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                title="Delete student"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout title="Students">
            <PageHeader
                title="Global student database"
                description="The central student identity record shared by every school and branch. Designed with UUID keys for legacy system mapping."
            >
                {can('students.manage') && (
                    <Link href="/students/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> Add student
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryTile label="Total students" value={counts.total} icon={GraduationCap} tone="text-brand-600 bg-brand-50" />
                <SummaryTile label="Active" value={counts.active} icon={UserRound} tone="text-emerald-600 bg-emerald-50" />
                <SummaryTile label="Male" value={counts.male} icon={UserRound} tone="text-sky-600 bg-sky-50" />
                <SummaryTile label="Female" value={counts.female} icon={UserRound} tone="text-rose-600 bg-rose-50" />
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search name, NISN, class…"
                            className="lg:col-span-1"
                        />
                        <Select value={filters.school_id ?? ''} onChange={(event) => apply({ school_id: event.target.value })}>
                            <option value="">All schools</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </Select>
                        <Select value={filters.branch_id ?? ''} onChange={(event) => apply({ branch_id: event.target.value })}>
                            <option value="">All branches</option>
                            {branches
                                .filter((branch) => !filters.school_id || branch.school_id === filters.school_id)
                                .map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={filters.grade_level ?? ''} onChange={(event) => apply({ grade_level: event.target.value })}>
                                <option value="">All grades</option>
                                {gradeLevels.map((grade) => (
                                    <option key={grade} value={grade}>Grade {grade}</option>
                                ))}
                            </Select>
                            <Select value={filters.status ?? ''} onChange={(event) => apply({ status: event.target.value })}>
                                <option value="">All status</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    rows={students.data}
                    empty={
                        <EmptyState
                            icon={GraduationCap}
                            title="No students match these filters"
                            description="Try a different school, branch or search term."
                            action={
                                can('students.manage') ? (
                                    <Link href="/students/create" className="btn-primary btn-sm">
                                        <Plus className="h-3.5 w-3.5" /> Add student
                                    </Link>
                                ) : null
                            }
                        />
                    }
                />

                <Pagination paginator={students} />
            </Card>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Download className="h-3 w-3" /> Need bulk export? Use the read-only integration API for the legacy systems.
            </p>
        </AppLayout>
    );
}

function SummaryTile({ label, value, icon: Icon, tone }) {
    return (
        <div className="card flex items-center gap-3 p-3.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}
