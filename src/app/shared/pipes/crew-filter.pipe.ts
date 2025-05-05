import { Pipe, PipeTransform } from '@angular/core';
import { Crew } from "../interface/schedule";
@Pipe({
  name: 'crewFilter'
})
export class CrewFilterPipe implements PipeTransform {

  transform(
    crew: Crew[],
    regionIds?: number[],
    levelIds?: number[]
  ): Crew[] {
    if (!crew) return [];

    return crew.filter(member => {
      const matchesRegion = !regionIds || regionIds.length === 0 || regionIds.includes(member.regionId);
      const matchesLevel = !levelIds || levelIds.length === 0 || levelIds.includes(member.levelId);
      return matchesRegion && matchesLevel;
    }).sort((a, b) => Number(b.isChecked) - Number(a.isChecked));
  }
}
