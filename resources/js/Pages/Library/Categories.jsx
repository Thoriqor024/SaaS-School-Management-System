import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, Field, Input, Modal, PageHeader, Textarea, confirmDelete } from '../../Components/ui';

export default function BookCategories({ categories, canManage }) {
    const [editing, setEditing] = useState(null);

    return (
        <AppLayout title="Book categories">
            <PageHeader title="Book categories" description="Organise the catalog for browsing, reporting and shelf planning.">
                <Link href="/library/books" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Books
                </Link>
                {canManage && (
                    <button type="button" onClick={() => setEditing('new')} className="btn-primary">
                        <Plus className="h-4 w-4" /> Add category
                    </button>
                )}
            </PageHeader>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Tags className="h-4 w-4" />
                            </span>
                            {canManage && (
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(category)}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => confirmDelete(`/library/categories/${category.id}`, `Delete category ${category.name}?`)}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{category.name}</p>
                        <p className="text-[11px] text-slate-500">{category.code}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{category.description || 'No description'}</p>
                        <Badge tone="violet" className="mt-3">{category.books_count} titles</Badge>
                    </Card>
                ))}
            </div>

            {editing && <CategoryModal category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
        </AppLayout>
    );
}

function CategoryModal({ category, onClose }) {
    const isEdit = Boolean(category);
    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        code: category?.code ?? '',
        description: category?.description ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/library/categories/${category.id}`, { onSuccess: onClose });
        else post('/library/categories', { onSuccess: onClose });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-lg"
            title={isEdit ? 'Edit category' : 'Add book category'}
            footer={
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" form="book-category-form" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save' : 'Create'}
                    </button>
                </div>
            }
        >
            <form id="book-category-form" onSubmit={submit} className="space-y-4">
                <Field label="Name" required error={errors.name}>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label="Code" required error={errors.code}>
                    <Input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} required />
                </Field>
                <Field label="Description" error={errors.description}>
                    <Textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </Field>
            </form>
        </Modal>
    );
}
