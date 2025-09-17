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
    const regionSet = regionIds?.length ? new Set(regionIds) : null;
    const levelSet = levelIds?.length ? new Set(levelIds) : null;
    const jobPartSet = jobPartIds?.length ? new Set(jobPartIds) : null;

    const result = crew.filter(member => {
      const matchesRegion = !regionSet || regionSet.has(member.regionId);
      const matchesLevel = !levelSet || levelSet.has(member.levelCrewingWeighting);

      let matchesAllJobParts = true;
      if (jobPartSet) {
        for (const id of jobPartSet) {
          if (!(member.notClashingInfo?.details?.[id] > 0)) {
            matchesAllJobParts = false;
            break;
          }
        }
      }

      const matchesSearch =
        !normalizedSearch || (member.nameLower ?? member.name?.toLowerCase()).includes(normalizedSearch);

      return matchesRegion && matchesLevel && matchesAllJobParts && matchesSearch;
    });

    result.sort((a, b) =>
      Number(b.isFulltime && b.isChecked) - Number(a.isFulltime && a.isChecked) ||
      Number(!b.isFulltime && b.isChecked) - Number(!a.isFulltime && a.isChecked) ||
      Number(a.holiday > 0) - Number(b.holiday > 0)
    );

    return result;
  }

}
