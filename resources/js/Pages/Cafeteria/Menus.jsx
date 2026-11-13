import { useForm } from '@inertiajs/react';
import { CalendarDays, ChefHat, Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Badge,
    Card,
    EmptyState,
    Field,
    Input,
    Modal,
    PageHeader,
    Select,
    Textarea,
    confirmDelete,
} from '../../Components/ui';
import { useCan } from '../../lib/auth';
import { formatDate, formatNumber, titleCase } from '../../lib/format';

const MENU_CATEGORIES = ['main', 'side', 'fruit', 'drink', 'dessert'];

export default function Menus({ menus, schools, branches, filters, mealTypes, counts }) {
    const can = useCan();
    const [type, setType] = useState(filters.meal_type ?? '');
    const [editing, setEditing] = useState(null);

    const filtered = useMemo(
        () => menus.filter((menu) => !type || menu.meal_type === type),
        [menus, type]
    );

    return (
        <AppLayout title="Cafeteria menus">
            <PageHeader title="Menu planner" description="Plan balanced meals per branch, publish the menu and track what was served.">
                {can('cafeteria.view') && (
                    <a href="/cafeteria/meal-logs" className="btn-secondary">Meal logs</a>
                )}
                {can('cafeteria.manage') && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add menu
                    </button>
                )}
            </PageHeader>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Menus planned" value={counts.total} icon={ChefHat} />
                <Tile label="This week" value={counts.this_week} icon={CalendarDays} tone="sky" />
                <Tile label="Published" value={counts.published} icon={UtensilsCrossed} tone="emerald" />
                <Tile label="Menu items" value={counts.items} icon={UtensilsCrossed} tone="amber" />
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={type} onChange={(event) => setType(event.target.value)} className="sm:max-w-[13rem]">
                    <option value="">All meal types</option>
                    {mealTypes.map((mealType) => (
                        <option key={mealType} value={mealType}>{titleCase(mealType)}</option>
                    ))}
                </Select>
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <EmptyState icon={ChefHat} title="No menus planned" description="Create a menu to start the weekly meal plan." />
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filtered.map((menu) => (
                        <Card key={menu.id} className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-sm font-bold text-slate-900">{menu.title}</h2>
                                        <Badge tone="sky">{titleCase(menu.meal_type)}</Badge>
                                        {menu.is_published ? <Badge tone="emerald">Published</Badge> : <Badge tone="slate">Draft</Badge>}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(menu.menu_date)} · {menu.branch ?? 'All branches'}
                                    </p>
                                    {menu.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{menu.description}</p>}
                                </div>
                                {can('cafeteria.manage') && (
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(menu)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => confirmDelete(`/cafeteria/menus/${menu.id}`, `Delete menu "${menu.title}"?`)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                {menu.items.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-medium text-slate-700">{item.name}</span>
                                            <span className="text-[10px] uppercase tracking-wide text-slate-400">{item.category}</span>
                                        </span>
                                        <span className="text-[10px] text-slate-500">{item.calories ? `${item.calories} kcal` : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            )}

            {editing && (
                <MenuModal
                    menu={editing === 'new' ? null : editing}
                    schools={schools}
                    branches={branches}
                    mealTypes={mealTypes}
                    onClose={() => setEditing(null)}
                />
            )}
        </AppLayout>
    );
}

function Tile({ label, value, icon: Icon, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-brand-50 text-brand-600',
        sky: 'bg-sky-50 text-sky-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
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

function MenuModal({ menu, schools, branches, mealTypes, onClose }) {
    const isEdit = Boolean(menu);

    const { data, setData, post, put, processing, errors } = useForm({
        school_id: menu?.school_id ?? schools[0]?.id ?? '',
        branch_id: menu?.branch_id ?? '',
        title: menu?.title ?? '',
        menu_date: menu?.menu_date ?? new Date().toISOString().slice(0, 10),
        meal_type: menu?.meal_type ?? 'lunch',
        description: menu?.description ?? '',
        is_published: menu?.is_published ?? true,
        items: (menu?.items ?? []).map((item) => ({
            name: item.name,
            category: item.category,
            calories: item.calories ?? '',
            allergens: item.allergens ?? '',
        })),
    });

    const visibleBranches = branches.filter((branch) => branch.school_id === data.school_id);

    const setItem = (index, key, value) => {
        const items = [...data.items];
        items[index] = { ...items[index], [key]: value };
        setData('items', items);
    };

    const addItem = () => setData('items', [...data.items, { name: '', category: 'main', calories: '', allergens: '' }]);
    const removeItem = (index) => setData('items', data.items.filter((_, i) => i !== index));

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/cafeteria/menus/${menu.id}`, { onSuccess: onClose });
        else post('/cafeteria/menus', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isEdit ? `Edit ${menu.title}` : 'Plan a menu'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="menu-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create menu'}
                    </button>
                </div>
            }
        >
            <form id="menu-form" onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Menu title" required error={errors.title} className="sm:col-span-2">
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Nasi Goreng Kampung" required />
                    </Field>
                    <Field label="Date" required error={errors.menu_date}>
                        <Input type="date" value={data.menu_date} onChange={(e) => setData('menu_date', e.target.value)} />
                    </Field>
                    <Field label="Meal type" required error={errors.meal_type}>
                        <Select value={data.meal_type} onChange={(e) => setData('meal_type', e.target.value)}>
                            {mealTypes.map((mealType) => (
                                <option key={mealType} value={mealType}>{titleCase(mealType)}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="School" required error={errors.school_id}>
                        <Select value={data.school_id} onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Branch" error={errors.branch_id}>
                        <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                            <option value="">All branches</option>
                            {visibleBranches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Description" error={errors.description} className="sm:col-span-2">
                        <Textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </Field>
                    <Field label="Visibility" error={errors.is_published} className="sm:col-span-2">
                        <Select value={data.is_published ? '1' : '0'} onChange={(e) => setData('is_published', e.target.value === '1')}>
                            <option value="1">Published to families</option>
                            <option value="0">Draft</option>
                        </Select>
                    </Field>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu items</p>
                        <button type="button" onClick={addItem} className="btn-secondary btn-sm">
                            <Plus className="h-3.5 w-3.5" /> Add item
                        </button>
                    </div>

                    <div className="space-y-2">
                        {data.items.length === 0 && (
                            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
                                Add dishes, fruit and drinks that are served with this menu.
                            </p>
                        )}
                        {data.items.map((item, index) => (
                            <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1fr_7rem_6rem_auto]">
                                <Input value={item.name} onChange={(e) => setItem(index, 'name', e.target.value)} placeholder="Item name" />
                                <Select value={item.category} onChange={(e) => setItem(index, 'category', e.target.value)}>
                                    {MENU_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{titleCase(category)}</option>
                                    ))}
                                </Select>
                                <Input
                                    type="number"
                                    value={item.calories}
                                    onChange={(e) => setItem(index, 'calories', e.target.value)}
                                    placeholder="kcal"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
