import { Pipe, PipeTransform } from '@angular/core';
import { Crew } from "../interface/schedule";

@Pipe({
  name: 'crewFilter'
})
export class CrewFilterPipe implements PipeTransform {

  transform(
    crew: Crew[],
    regionIds?: number[],
    levelIds?: number[],
    jobPartIds?: number[],
  ): Crew[] {
    if (!crew) return [];

    return crew.filter(member => {
      const matchesRegion = !regionIds || regionIds.length === 0 || regionIds.includes(member.regionId);
      const matchesLevel = !levelIds || levelIds.length === 0 || levelIds.includes(member.levelCrewingWeighting);
      const matchesJobParts =
        !jobPartIds || jobPartIds.length === 0 ||
        member.jobPartIds?.some(id => jobPartIds.includes(id));

      return matchesRegion && matchesLevel && matchesJobParts
    }).sort((a, b) =>
      Number(b.isFulltime && b.isChecked) - Number(a.isFulltime && a.isChecked) ||
      Number(!b.isFulltime && b.isChecked) - Number(!a.isFulltime && a.isChecked) ||
      Number(a.holiday > 0) - Number(b.holiday > 0)
    );
  }
}
