<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TutorResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'slug'             => $this->slug,
            'tagline'          => $this->tagline,
            'qualification'    => $this->qualification,
            'experience_years' => $this->experience_years,
            'subjects'         => $this->subjects_list,
            'fee_hourly'       => (float) $this->fee_hourly,
            'fee_trial'        => (float) $this->fee_trial,
            'city'             => $this->city,
            'state'            => $this->state,
            'localities'       => $this->localities_list,
            'pincodes'         => $this->pincodes_list,
            'grades'           => $this->grades_list,
            'languages'        => $this->languages_list,
            'teaching_mode'    => $this->teaching_mode,
            'teaches_home'     => $this->teaches_home,
            'verified'         => $this->verified,
            'image_url'        => $this->image_url,
            'bio'              => $this->when($request->routeIs('api.tutors.show'), $this->bio),
        ];
    }
}
