<?php

namespace App\Http\Controllers;

use App\Support\ReportData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Reports/Index', ReportData::build($request->user(), $request->input('school_id')));
    }
}
