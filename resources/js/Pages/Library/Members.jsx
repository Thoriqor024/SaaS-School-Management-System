import { router, useForm } from '@inertiajs/react';
import { Contact, Loader2, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Pagination,
    SearchInput,
    Select,
    StatusBadge,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

export default function Members({ members, students, employees, schools, branches, filters, counts }) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.member_type ?? '');
    const [adding, setAdding] = useState(false);

    const apply = (overrides = {}) => {
        router.get('/library/members', { ...filters, search, member_type: type, ...overrides }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggleStatus = (member) => {
        router.put(
            `/library/members/${member.id}`,
            {
                status: member.status === 'active' ? 'suspended' : 'active',
                max_loans: member.max_loans,
                expires_at: member.expires_at,
            },
            { preserveScroll: true }
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Member',
            render: (member) => (
                <div>
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="text-[11px] text-slate-500">{member.member_code} · {member.member_type}</p>
                </div>
            ),
        },
        { key: 'identity', label: 'Identity', render: (member) => <span className="text-xs text-slate-600">{member.identity ?? member.classroom ?? '—'}</span> },
        { key: 'branch', label: 'Branch', render: (member) => <span className="text-xs text-slate-600">{member.branch ?? '—'}</span> },
        { key: 'joined_at', label: 'Joined', render: (member) => <span className="text-xs text-slate-500">{formatDate(member.joined_at)}</span> },
        { key: 'expires_at', label: 'Expires', render: (member) => <span className="text-xs text-slate-500">{formatDate(member.expires_at)}</span> },
        {
            key: 'active_loans',
            label: 'On loan',
            render: (member) => (
                <Badge tone={member.active_loans > 0 ? 'amber' : 'slate'}>
                    {member.active_loans} / {member.max_loans}
                </Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (member) =>
                can('library.manage') ? (
                    <button type="button" onClick={() => toggleStatus(member)} title="Toggle membership status">
                        <StatusBadge value={member.status} />
                    </button>
                ) : (
                    <StatusBadge value={member.status} />
                ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (member) =>
                can('library.manage') ? (
                    <button
                        type="button"
                        onClick={() => confirmDelete(`/library/members/${member.id}`, `Delete the membership for ${member.name}?`)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null,
        },
    ];

    return (
        <AppLayout title="Library members">
            <PageHeader title="Library members" description="Register students and staff, set borrowing limits and suspend membership when needed.">
                {can('library.manage') && (
                    <button type="button" onClick={() => setAdding(true)} className="btn-primary">
                        <UserPlus className="h-4 w-4" /> Register member
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Members" value={counts.total} icon={Contact} />
                <Tile label="Students" value={counts.students} icon={Users} tone="sky" />
                <Tile label="Staff" value={counts.employees} icon={Users} tone="violet" />
                <Tile label="Active" value={counts.active} icon={Contact} tone="emerald" />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search name or member code…" className="sm:max-w-xs" />
                    <Select
                        value={type}
                        onChange={(event) => {
                            setType(event.target.value);
                            apply({ member_type: event.target.value });
                        }}
                        className="sm:max-w-[12rem]"
                    >
                        <option value="">All members</option>
                        <option value="student">Students</option>
                        <option value="employee">Staff</option>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    rows={members.data}
                    empty={<EmptyState icon={Contact} title="No members registered" description="Register a student or staff member to start lending books." />}
                />

                <Pagination paginator={members} />
            </Card>

            {adding && (
                <MemberModal
                    students={students}
                    employees={employees}
                    schools={schools}
                    branches={branches}
                    onClose={() => setAdding(false)}
                />
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        sky: 'bg-sky-50 text-sky-600',
        violet: 'bg-violet-50 text-violet-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="card flex items-center gap-3 p-3.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-lg font-bold leading-tight text-slate-900">{formatNumber(value)}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function MemberModal({ students, employees, schools, branches, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        school_id: schools[0]?.id ?? '',
        branch_id: '',
        member_type: 'student',
        student_id: '',
        employee_id: '',
        joined_at: new Date().toISOString().slice(0, 10),
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        max_loans: 3,
        status: 'active',
        notes: '',
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);
    const people = data.member_type === 'student' ? students : employees;

    const submit = (event) => {
        event.preventDefault();
        post('/library/members', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Register a library member"
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="member-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Register
                    </button>
                </div>
            }
        >
            <form id="member-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Member type" required error={errors.member_type}>
                    <Select
                        value={data.member_type}
                        onChange={(e) => setData((values) => ({ ...values, member_type: e.target.value, student_id: '', employee_id: '' }))}
                    >
                        <option value="student">Student</option>
                        <option value="employee">Teacher / staff</option>
                    </Select>
                </Field>
                <Field label="School" required error={errors.school_id}>
                    <Select value={data.school_id} onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}>
                        {schools.map((school) => (
                            <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label={data.member_type === 'student' ? 'Student' : 'Employee'} required error={errors.student_id ?? errors.employee_id} className="sm:col-span-2">
                    <Select
                        value={data.member_type === 'student' ? data.student_id : data.employee_id}
                        onChange={(e) => setData(data.member_type === 'student' ? 'student_id' : 'employee_id', e.target.value)}
                        required
                    >
                        <option value="">Select a person</option>
                        {people.map((person) => (
                            <option key={person.id} value={person.id}>
                                {person.full_name} {person.classroom ? `· ${person.classroom}` : person.position ? `· ${person.position}` : ''}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Branch" error={errors.branch_id}>
                    <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                        <option value="">No specific branch</option>
                        {visibleBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Status" error={errors.status}>
                    <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </Select>
                </Field>
                <Field label="Joined" error={errors.joined_at}>
                    <Input type="date" value={data.joined_at} onChange={(e) => setData('joined_at', e.target.value)} />
                </Field>
                <Field label="Expires" error={errors.expires_at}>
                    <Input type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} />
                </Field>
                <Field label="Max concurrent loans" required error={errors.max_loans}>
                    <Input type="number" min="1" max="20" value={data.max_loans} onChange={(e) => setData('max_loans', e.target.value)} />
                </Field>
                <Field label="Notes" error={errors.notes} className="sm:col-span-2">
                    <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}
