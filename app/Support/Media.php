<?php

namespace App\Support;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Picqer\Barcode\BarcodeGeneratorSVG;

class Media
{
    /**
     * Store an uploaded photo on the public disk and return its relative path.
     */
    public static function storePhoto(UploadedFile $file, string $directory, ?string $current = null): string
    {
        if ($current) {
            Storage::disk('public')->delete($current);
        }

        return $file->store($directory, 'public');
    }

    public static function deletePhoto(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    public static function photoUrl(?string $path): ?string
    {
        return $path ? '/storage/'.ltrim($path, '/') : null;
    }

    /**
     * Code 128 barcode as an inline SVG string (no GD dependency).
     */
    public static function barcodeSvg(string $code, float $height = 48): string
    {
        $generator = new BarcodeGeneratorSVG();

        return $generator->getBarcode($code, BarcodeGeneratorSVG::TYPE_CODE_128, 1.4, $height);
    }

    /**
     * QR code as an inline SVG string.
     */
    public static function qrSvg(string $text, int $size = 150): string
    {
        $renderer = new ImageRenderer(new RendererStyle($size, 1), new SvgImageBackEnd());

        return (new Writer($renderer))->writeString($text);
    }
}
