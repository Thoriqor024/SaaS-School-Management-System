import { router, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    Checkbox,
    DataTable,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    SearchInput,
    Select,
    confirmDelete,
} from '../../Components/ui';
import { formatDateTime, initials } from '../../lib/format';

export default function Users({ users, roles, schools, branches, employees, filters, canManage }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null);

    const filtered = users.filter((user) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [user.name, user.email, user.job_title].filter(Boolean).some((value) => value.toLowerCase().includes(term));
    });

    const columns = [
        {
            key: 'name',
            label: 'Account',
            render: (user) => (
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-700">
                        {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{user.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'roles',
            label: 'Roles',
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                        <Badge key={role} tone="indigo">{role}</Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'school',
            label: 'Placement',
            render: (user) => (
                <div>
                    <p className="text-slate-700">{user.school ?? 'All schools'}</p>
                    <p className="text-[11px] text-slate-500">{user.branch ?? 'Group level'}</p>
                </div>
            ),
        },
        {
            key: 'last_login_at',
            label: 'Last sign-in',
            render: (user) => (
                <span className="text-xs text-slate-500">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</span>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (user) => (user.is_active ? <Badge tone="emerald">Active</Badge> : <Badge tone="rose">Disabled</Badge>),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (user) => (
                <div className="flex items-center justify-end gap-1">
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setEditing(user)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            title="Edit account"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                    {canManage && !user.is_self && (
                        <button
                            type="button"
                            onClick={() => confirmDelete(`/access/users/${user.id}`, `Delete the login account for ${user.name}?`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete account"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout title="Login accounts">
            <PageHeader
                title="Login accounts"
                description="Role-based access control for every school. Employee data lives in the HR module — this is only how people sign in."
            >
                {canManage && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <UserPlus className="h-4 w-4" /> New account
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Accounts</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Roles configured</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{roles.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Disabled accounts</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{users.filter((user) => !user.is_active).length}</p>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search accounts…" className="sm:max-w-sm" />
                </div>
                <DataTable
                    columns={columns}
                    rows={filtered}
                    empty={<EmptyState icon={ShieldCheck} title="No accounts found" description="Create a login account to get someone started." />}
                />
            </Card>

            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5" />
                    Passwords are hashed. Roles can be reassigned at any time without touching the employee record.
                </p>
                <a href="/access/roles" className="font-semibold text-brand-700 hover:text-brand-800">
                    Manage role permissions →
                </a>
            </div>

            {editing && (
                <UserModal
                    user={editing === 'new' ? null : editing}
                    roles={roles}
                    schools={schools}
                    branches={branches}
                    employees={employees}
                    onClose={() => setEditing(null)}
                />
            )}
        </AppLayout>
    );
}

function UserModal({ user, roles, schools, branches, employees, onClose }) {
    const isEdit = Boolean(user);

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        phone: user?.phone ?? '',
        job_title: user?.job_title ?? '',
        school_id: user?.school_id ?? '',
        branch_id: user?.branch_id ?? '',
        employee_id: user?.employee_id ?? '',
        is_active: user?.is_active ?? true,
        roles: user?.role_ids ?? [],
    });

    const visibleBranches = useMemo(
        () => branches.filter((branch) => branch.school_id === data.school_id),
        [branches, data.school_id]
    );

    const toggleRole = (roleId) => {
        setData('roles', data.roles.includes(roleId) ? data.roles.filter((id) => id !== roleId) : [...data.roles, roleId]);
    };

    const submit = (event) => {
        event.preventDefault();

        if (isEdit) {
            put(`/access/users/${user.id}`, { onSuccess: onClose });
        } else {
            post('/access/users', { onSuccess: onClose });
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${user.name}` : 'Create login account'}
            description="Accounts are linked to a school and, optionally, to an employee record."
            footer={
                <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="user-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        {isEdit ? 'Save changes' : 'Create account'}
                    </button>
                </div>
            }
        >
            <form id="user-form" onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    </Field>
                    <Field label="Email" required error={errors.email}>
                        <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                    </Field>
                    <Field label={isEdit ? 'New password' : 'Password'} required={!isEdit} error={errors.password} hint={isEdit ? 'Leave blank to keep the current password.' : 'Minimum 8 characters.'}>
                        <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required={!isEdit} autoComplete="new-password" />
                    </Field>
                    <Field label="Job title" error={errors.job_title}>
                        <Input value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} />
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                        <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </Field>
                    <Field label="Linked employee" error={errors.employee_id}>
                        <Select value={data.employee_id} onChange={(e) => setData('employee_id', e.target.value)}>
                            <option value="">Not linked</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.full_name} · {employee.position ?? employee.type}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="School" error={errors.school_id}>
                        <Select
                            value={data.school_id}
                            onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}
                        >
                            <option value="">All schools (group level)</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
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
                </div>

                <Field label="Roles" required error={errors.roles}>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {roles.map((role) => (
                            <label
                                key={role.id}
                                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.roles.includes(role.id)}
                                    onChange={() => toggleRole(role.id)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span>
                                    <span className="block text-sm font-medium text-slate-800">{role.name}</span>
                                    <span className="block text-[11px] text-slate-500">{role.description}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>

                <Checkbox
                    label="Account is active"
                    description="Disabled accounts cannot sign in."
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                />
            </form>
        </Modal>
    );
}
