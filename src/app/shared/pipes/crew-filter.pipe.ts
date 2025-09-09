import { Pipe, PipeTransform } from '@angular/core';
import { Crew } from "../interface/schedule";

@Pipe({
  name: 'crewFilter',
  standalone: true,
})
export class CrewFilterPipe implements PipeTransform {

  transform(
    crew: Crew[],
    regionIds?: number[],
    levelIds?: number[],
    jobPartIds?: number[],
    searchKey?: string,
  ): Crew[] {
    if (!crew) return [];

    const normalizedSearch = searchKey?.toLowerCase().trim();

    return crew.filter(member => {
      const matchesRegion = !regionIds || regionIds.length === 0 || regionIds.includes(member.regionId);
      const matchesLevel = !levelIds || levelIds.length === 0 || levelIds.includes(member.levelCrewingWeighting);

      const matchesAllJobParts =
        !jobPartIds || jobPartIds.length === 0 ||
        jobPartIds.every(id => member.notClashingInfo?.details?.[id] > 0);

      const matchesSearch =
        !normalizedSearch || member.name?.toLowerCase().includes(normalizedSearch);

      return matchesRegion && matchesLevel && matchesAllJobParts && matchesSearch;
    }).sort((a, b) =>
      Number(b.isFulltime && b.isChecked) - Number(a.isFulltime && a.isChecked) ||
      Number(!b.isFulltime && b.isChecked) - Number(!a.isFulltime && a.isChecked) ||
      Number(a.holiday > 0) - Number(b.holiday > 0)
    );
  }
}
