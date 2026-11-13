import { Link, router } from '@inertiajs/react';
import { Briefcase, Eye, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
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
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function EmployeesIndex({ employees, filters, schools, branches, types, employmentStatuses, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (overrides = {}) => {
        router.get('/employees', { ...filters, search, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
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
            label: 'Employee',
            render: (employee) => (
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[11px] font-bold text-sky-700">
                        {employee.full_name?.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{employee.full_name}</p>
                        <p className="truncate text-[11px] text-slate-500">{employee.employee_number}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'position',
            label: 'Position',
            render: (employee) => (
                <div>
                    <p className="text-slate-700">{employee.position || '—'}</p>
                    <p className="text-[11px] text-slate-500">{employee.department || ''}</p>
                </div>
            ),
        },
        { key: 'type', label: 'Type', render: (employee) => <StatusBadge value={employee.type} /> },
        { key: 'employment_status', label: 'Employment', render: (employee) => <StatusBadge value={employee.employment_status} /> },
        {
            key: 'branch',
            label: 'School / branch',
            render: (employee) => (
                <div>
                    <p className="text-slate-700">{employee.school?.name ?? '—'}</p>
                    <p className="text-[11px] text-slate-500">{employee.branch?.name ?? 'No branch'}</p>
                </div>
            ),
        },
        {
            key: 'join_date',
            label: 'Joined',
            render: (employee) => <span className="text-slate-600">{formatDate(employee.join_date)}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (employee) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={`/employees/${employee.id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700" title="View profile">
                        <Eye className="h-4 w-4" />
                    </Link>
                    {can('employees.manage') && (
                        <>
                            <Link href={`/employees/${employee.id}/edit`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700" title="Edit">
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => confirmDelete(`/employees/${employee.id}`, `Remove ${employee.full_name} from the employee database?`)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                title="Delete"
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
        <AppLayout title="Employees">
            <PageHeader
                title="Teachers, staff & general employees"
                description="One master record per person, whether they teach, run administration or keep the campus running."
            >
                {can('employees.manage') && (
                    <Link href="/employees/create" className="btn-primary">
                        <Plus className="h-4 w-4" /> Add employee
                    </Link>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Total employees" value={counts.total} icon={UsersRound} />
                <Tile label="Teachers" value={counts.teachers} icon={Briefcase} />
                <Tile label="Staff" value={counts.staff} icon={Briefcase} />
                <Tile label="General employees" value={counts.general} icon={Briefcase} />
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <SearchInput value={search} onChange={setSearch} placeholder="Search name, number, position…" />
                        <Select value={filters.school_id ?? ''} onChange={(event) => apply({ school_id: event.target.value })}>
                            <option value="">All schools</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </Select>
                        <Select value={filters.type ?? ''} onChange={(event) => apply({ type: event.target.value })}>
                            <option value="">All types</option>
                            {types.map((type) => (
                                <option key={type} value={type}>{titleCase(type)}</option>
                            ))}
                        </Select>
                        <Select value={filters.employment_status ?? ''} onChange={(event) => apply({ employment_status: event.target.value })}>
                            <option value="">All employment</option>
                            {employmentStatuses.map((status) => (
                                <option key={status} value={status}>{titleCase(status)}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    rows={employees.data}
                    empty={
                        <EmptyState
                            icon={UsersRound}
                            title="No employees match these filters"
                            description="Adjust the filters or add a new employee record."
                        />
                    }
                />

                <Pagination paginator={employees} />
            </Card>
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon }) {
    return (
        <div className="card flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}
