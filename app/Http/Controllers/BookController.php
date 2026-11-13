<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookCategory;
use App\Support\OptionLists;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->input('search'));

        $books = Book::query()
            ->visibleTo($user)
            ->with(['category:id,name', 'branch:id,name'])
            ->withCount(['activeLoans'])
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('title', 'like', "%{$search}%")
                ->orWhere('author', 'like', "%{$search}%")
                ->orWhere('isbn', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%")))
            ->when($request->input('book_category_id'), fn ($q, $v) => $q->where('book_category_id', $v))
            ->when($request->input('school_id'), fn ($q, $v) => $q->where('school_id', $v))
            ->orderBy('title')
            ->paginate(10)
            ->withQueryString();

        $base = Book::query()->visibleTo($user);

        return Inertia::render('Library/Books', [
            'books' => $books,
            'categories' => BookCategory::orderBy('name')->get(['id', 'name', 'code']),
            'schools' => OptionLists::schools($user),
            'branches' => OptionLists::branches($user),
            'filters' => $request->only(['search', 'book_category_id', 'school_id']),
            'counts' => [
                'titles' => (clone $base)->count(),
                'copies' => (int) (clone $base)->sum('total_copies'),
                'available' => (int) (clone $base)->sum('available_copies'),
                'on_loan' => (int) (clone $base)->sum('total_copies') - (int) (clone $base)->sum('available_copies'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Library/BookForm', [
            'book' => null,
            'categories' => BookCategory::orderBy('name')->get(['id', 'name']),
            'schools' => OptionLists::schools($request->user()),
            'branches' => OptionLists::branches($request->user()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        Book::create($data);

        return redirect()->route('library.books.index')->with('success', 'Book "'.$data['title'].'" was added to the catalog.');
    }

    public function edit(Request $request, Book $book): Response
    {
        abort_unless($this->canAccess($request, $book->school_id), 403);

        return Inertia::render('Library/BookForm', [
            'book' => $book,
            'categories' => BookCategory::orderBy('name')->get(['id', 'name']),
            'schools' => OptionLists::schools($request->user()),
            'branches' => OptionLists::branches($request->user()),
        ]);
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        abort_unless($this->canAccess($request, $book->school_id), 403);

        $data = $this->validated($request, $book);
        $this->ensureRecordScope($request, $data['school_id'], $data['branch_id'] ?? null);
        $book->update($data);

        return redirect()->route('library.books.index')->with('success', 'Book was updated.');
    }

    public function destroy(Request $request, Book $book): RedirectResponse
    {
        abort_unless($this->canAccess($request, $book->school_id), 403);

        if ($book->activeLoans()->exists()) {
            return back()->with('error', 'This book still has copies on loan.');
        }

        $book->delete();

        return redirect()->route('library.books.index')->with('success', 'Book was removed from the catalog.');
    }

    public function categories(Request $request): Response
    {
        $categories = BookCategory::query()->withCount('books')->orderBy('name')->get()
            ->map(fn (BookCategory $category) => [...$category->only(['id', 'name', 'code', 'description']), 'books_count' => $category->books_count]);

        return Inertia::render('Library/Categories', [
            'categories' => $categories,
            'canManage' => $request->user()->hasPermission('library.manage'),
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:24', 'unique:book_categories,code'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        BookCategory::create($data);

        return back()->with('success', 'Book category was created.');
    }

    public function updateCategory(Request $request, BookCategory $category): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'code' => ['required', 'string', 'max:24', Rule::unique('book_categories', 'code')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $category->update($data);

        return back()->with('success', 'Book category was updated.');
    }

    public function destroyCategory(BookCategory $category): RedirectResponse
    {
        if ($category->books()->exists()) {
            return back()->with('error', 'Reassign the books in this category before deleting it.');
        }

        $category->delete();

        return back()->with('success', 'Book category was deleted.');
    }

    protected function validated(Request $request, ?Book $book = null): array
    {
        $data = $request->validate([
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'book_category_id' => ['nullable', 'uuid', 'exists:book_categories,id'],
            'title' => ['required', 'string', 'max:180'],
            'author' => ['nullable', 'string', 'max:120'],
            'publisher' => ['nullable', 'string', 'max:120'],
            'published_year' => ['nullable', 'integer', 'min:1500', 'max:2100'],
            'isbn' => ['nullable', 'string', 'max:32'],
            'barcode' => ['nullable', 'string', 'max:64', Rule::unique('books', 'barcode')->ignore($book?->id)],
            'shelf_location' => ['nullable', 'string', 'max:60'],
            'language' => ['nullable', 'string', 'max:24'],
            'total_copies' => ['required', 'integer', 'min:1', 'max:9999'],
            'available_copies' => ['required', 'integer', 'min:0', 'max:9999'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['available_copies'] = min($data['available_copies'], $data['total_copies']);
        $data['barcode'] = ($data['barcode'] ?? null) ?: 'BK-'.strtoupper(Str::random(8));

        return $data;
    }
}
