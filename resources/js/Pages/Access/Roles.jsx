import { router } from '@inertiajs/react';
import { Loader2, Lock, Save, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, PageHeader } from '../../Components/ui';

export default function Roles({ roles, permissionGroups, canManage }) {
    return (
        <AppLayout title="Roles & permissions">
            <PageHeader
                title="Roles & permissions"
                description="Every module route is protected by a permission. Adjust what each role can see and change."
            />

            <div className="grid gap-4 xl:grid-cols-2">
                {roles.map((role) => (
                    <RoleCard key={role.id} role={role} permissionGroups={permissionGroups} canManage={canManage} />
                ))}
            </div>
        </AppLayout>
    );
}

function RoleCard({ role, permissionGroups, canManage }) {
    const [selected, setSelected] = useState(role.permissions);
    const [saving, setSaving] = useState(false);

    const locked = role.slug === 'super_admin' || !canManage;

    const toggle = (id) => {
        setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    };

    const toggleGroup = (permissions, enabled) => {
        const ids = permissions.map((permission) => permission.id);
        setSelected((current) =>
            enabled ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id))
        );
    };

    const save = () => {
        setSaving(true);
        router.put(
            `/access/roles/${role.id}/permissions`,
            { permissions: selected },
            { preserveScroll: true, onFinish: () => setSaving(false) }
        );
    };

    return (
        <Card>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">{role.name}</h2>
                        <Badge tone={role.slug === 'super_admin' ? 'indigo' : 'slate'}>Level {role.level}</Badge>
                        {role.is_system && <Badge tone="slate">System</Badge>}
                    </div>
                    <p className="mt-1 max-w-md text-xs text-slate-500">{role.description}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Users className="h-3 w-3" /> {role.users_count} account{role.users_count === 1 ? '' : 's'} ·
                        <ShieldCheck className="h-3 w-3" /> {selected.length} permissions
                    </p>
                </div>
                {!locked ? (
                    <button type="button" onClick={save} disabled={saving} className="btn-primary btn-sm">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                        <Lock className="h-3 w-3" /> {role.slug === 'super_admin' ? 'Full access' : 'Read only'}
                    </span>
                )}
            </div>

            <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                {permissionGroups.map((group) => {
                    const allSelected = group.permissions.every((permission) => selected.includes(permission.id));

                    return (
                        <div key={group.group}>
                            <div className="mb-1.5 flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.group}</p>
                                {!locked && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.permissions, !allSelected)}
                                        className="text-[10px] font-medium text-brand-700 hover:text-brand-800"
                                    >
                                        {allSelected ? 'Clear' : 'Select all'}
                                    </button>
                                )}
                            </div>
                            <ul className="space-y-1">
                                {group.permissions.map((permission) => (
                                    <li key={permission.id}>
                                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-xs text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(permission.id)}
                                                onChange={() => toggle(permission.id)}
                                                disabled={locked}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:opacity-60"
                                            />
                                            <span className={selected.includes(permission.id) ? 'text-slate-800' : ''}>{permission.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
