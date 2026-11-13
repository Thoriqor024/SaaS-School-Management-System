<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Book;
use App\Support\Media;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabelController extends Controller
{
    public function book(Request $request, Book $book): Response
    {
        abort_unless($this->canAccess($request, $book->school_id), 403);

        return $this->label(
            code: $book->barcode ?: $book->id,
            title: $book->title,
            subtitle: $book->author ?: 'Library collection',
            lines: [
                $book->category?->name,
                $book->shelf_location ? 'Shelf '.$book->shelf_location : null,
                $book->isbn ? 'ISBN '.$book->isbn : null,
            ],
            backUrl: '/library/books',
            backLabel: 'Back to catalog',
        );
    }

    public function asset(Request $request, Asset $asset): Response
    {
        abort_unless($this->canAccess($request, $asset->school_id), 403);

        return $this->label(
            code: $asset->asset_code,
            title: $asset->name,
            subtitle: $asset->category?->name ?: 'Physical asset',
            lines: [
                $asset->location,
                $asset->branch?->name,
                $asset->quantity.' '.$asset->unit,
            ],
            backUrl: '/assets',
            backLabel: 'Back to assets',
        );
    }

    /**
     * Scanner landing page: accepts a scanned barcode / QR payload and shows matches.
     */
    public function scan(Request $request): Response
    {
        $code = trim((string) $request->input('code'));
        $user = $request->user();

        $books = [];
        $assets = [];

        if ($code !== '') {
            $books = Book::query()
                ->visibleTo($user)
                ->with(['category:id,name', 'branch:id,name'])
                ->where(fn ($query) => $query->where('barcode', $code)->orWhere('isbn', $code))
                ->limit(10)
                ->get()
                ->map(fn (Book $book) => [
                    'id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'barcode' => $book->barcode,
                    'category' => $book->category?->name,
                    'branch' => $book->branch?->name,
                    'available_copies' => $book->available_copies,
                    'total_copies' => $book->total_copies,
                ]);

            $assets = Asset::query()
                ->visibleTo($user)
                ->with(['category:id,name', 'branch:id,name'])
                ->where('asset_code', $code)
                ->limit(10)
                ->get()
                ->map(fn (Asset $asset) => [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'asset_code' => $asset->asset_code,
                    'category' => $asset->category?->name,
                    'branch' => $asset->branch?->name,
                    'condition' => $asset->condition,
                    'status' => $asset->status,
                    'quantity' => $asset->quantity,
                    'unit' => $asset->unit,
                ]);
        }

        return Inertia::render('Library/Scan', [
            'code' => $code,
            'books' => $books,
            'assets' => $assets,
            'canManageBooks' => $user->hasPermission('library.manage'),
            'canManageAssets' => $user->hasPermission('assets.manage'),
        ]);
    }

    protected function label(string $code, string $title, string $subtitle, array $lines, string $backUrl, string $backLabel): Response
    {
        return Inertia::render('Library/Label', [
            'title' => $title,
            'subtitle' => $subtitle,
            'lines' => array_values(array_filter($lines)),
            'code' => $code,
            'barcode' => Media::barcodeSvg($code),
            'qr' => Media::qrSvg($code),
            'backUrl' => $backUrl,
            'backLabel' => $backLabel,
        ]);
    }
}
