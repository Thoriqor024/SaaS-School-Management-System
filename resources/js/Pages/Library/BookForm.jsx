import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, ScanLine } from 'lucide-react';
import { useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../Components/ui';

export default function BookForm({ book, categories, schools, branches }) {
    const isEdit = Boolean(book);

    const { data, setData, post, put, processing, errors } = useForm({
        school_id: book?.school_id ?? schools[0]?.id ?? '',
        branch_id: book?.branch_id ?? '',
        book_category_id: book?.book_category_id ?? '',
        title: book?.title ?? '',
        author: book?.author ?? '',
        publisher: book?.publisher ?? '',
        published_year: book?.published_year ?? '',
        isbn: book?.isbn ?? '',
        barcode: book?.barcode ?? '',
        shelf_location: book?.shelf_location ?? '',
        language: book?.language ?? 'Indonesian',
        total_copies: book?.total_copies ?? 1,
        available_copies: book?.available_copies ?? 1,
        description: book?.description ?? '',
    });

    const visibleBranches = useMemo(() => branches.filter((branch) => branch.school_id === data.school_id), [branches, data.school_id]);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/library/books/${book.id}`);
        else post('/library/books');
    };

    return (
        <AppLayout title={isEdit ? 'Edit book' : 'Add book'}>
            <PageHeader
                title={isEdit ? `Edit ${book.title}` : 'Add a book'}
                description="Leave the barcode empty and the system will generate one automatically for label printing."
            >
                <Link href="/library/books" className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
            </PageHeader>

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader title="Bibliographic details" />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                        <Field label="Title" required error={errors.title} className="sm:col-span-2">
                            <Input value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                        </Field>
                        <Field label="Category" error={errors.book_category_id}>
                            <Select value={data.book_category_id} onChange={(e) => setData('book_category_id', e.target.value)}>
                                <option value="">Uncategorised</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Author" error={errors.author}>
                            <Input value={data.author} onChange={(e) => setData('author', e.target.value)} />
                        </Field>
                        <Field label="Publisher" error={errors.publisher}>
                            <Input value={data.publisher} onChange={(e) => setData('publisher', e.target.value)} />
                        </Field>
                        <Field label="Published year" error={errors.published_year}>
                            <Input type="number" value={data.published_year} onChange={(e) => setData('published_year', e.target.value)} />
                        </Field>
                        <Field label="ISBN" error={errors.isbn}>
                            <Input value={data.isbn} onChange={(e) => setData('isbn', e.target.value)} />
                        </Field>
                        <Field label="Language" error={errors.language}>
                            <Select value={data.language} onChange={(e) => setData('language', e.target.value)}>
                                {['Indonesian', 'English', 'Arabic', 'Mandarin', 'Other'].map((language) => (
                                    <option key={language} value={language}>{language}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Shelf location" error={errors.shelf_location}>
                            <Input value={data.shelf_location} onChange={(e) => setData('shelf_location', e.target.value)} placeholder="e.g. C-04" />
                        </Field>
                        <Field label="Barcode" error={errors.barcode} hint="Auto-generated when left blank.">
                            <div className="relative">
                                <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input className="pl-9" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Description" error={errors.description} className="sm:col-span-2 lg:col-span-3">
                            <Textarea rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Stock & placement" description="Available copies are reduced automatically when a loan is issued." />
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                        <Field label="School" required error={errors.school_id} className="lg:col-span-2">
                            <Select
                                value={data.school_id}
                                onChange={(e) => setData((values) => ({ ...values, school_id: e.target.value, branch_id: '' }))}
                            >
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
                        <Field label="Total copies" required error={errors.total_copies}>
                            <Input
                                type="number"
                                min="1"
                                value={data.total_copies}
                                onChange={(e) => {
                                    const total = Number(e.target.value);
                                    setData((values) => ({
                                        ...values,
                                        total_copies: e.target.value,
                                        available_copies: Math.min(Number(values.available_copies), total || 0),
                                    }));
                                }}
                            />
                        </Field>
                        <Field label="Available copies" required error={errors.available_copies}>
                            <Input
                                type="number"
                                min="0"
                                max={data.total_copies}
                                value={data.available_copies}
                                onChange={(e) => setData('available_copies', e.target.value)}
                            />
                        </Field>
                        <div className="flex items-end lg:col-span-3">
                            <Badge tone="violet">Barcode & QR ready · scan at circulation desk</Badge>
                        </div>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-2">
                    <Link href="/library/books" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Save changes' : 'Add book'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
