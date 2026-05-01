import { Pipe, PipeTransform } from '@angular/core';
import { Crew } from "../interface/schedule";

/**
 * `notClashingInfo.details[jobPartId]` counts how many crew slots are free (non-clashing)
 * for that job part from the API. If any selected job part has no entry or count ≤ 0,
 * the crew is treated as unavailable for that selection.
 */
export function crewIsUnavailableForSelectedJobParts(
  member: Crew,
  jobPartIds: number[] | null | undefined
): boolean {
  if (!jobPartIds?.length) {
    return false;
  }
  for (const id of jobPartIds) {
    if (!(member.notClashingInfo?.details?.[id] > 0)) {
      return true;
    }
  }
  return false;
}

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

    const result = crew.filter(member => {
      const matchesRegion = !regionSet || regionSet.has(member.regionId);
      const matchesLevel = !levelSet || levelSet.has(member.levelCrewingWeighting);

      const matchesSearch =
        !normalizedSearch || (member.nameLower ?? member.name?.toLowerCase()).includes(normalizedSearch);

      return matchesRegion && matchesLevel && matchesSearch;
    });

    result.sort((a, b) =>
      Number(crewIsUnavailableForSelectedJobParts(a, jobPartIds)) -
      Number(crewIsUnavailableForSelectedJobParts(b, jobPartIds)) ||
      Number(b.isFulltime && b.isChecked) - Number(a.isFulltime && a.isChecked) ||
      Number(!b.isFulltime && b.isChecked) - Number(!a.isFulltime && a.isChecked) ||
      Number(a.holiday > 0) - Number(b.holiday > 0)
    );

    return result;
  }

}
