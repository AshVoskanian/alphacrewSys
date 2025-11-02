import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from "rxjs";
import { ApiBase } from "../../../shared/bases/api-base";
import { FilterDropdowns } from "../../../shared/interface/crew";

@Injectable({
  providedIn: 'root'
})
export class CrewService extends ApiBase {
  getDropdownsData() {
    return this.get<FilterDropdowns>('Crew/GetCrewEditUpdateDropDown')
      .pipe(
        map((res) => {
          const updatedData = Object.fromEntries(
            Object.entries(res.data).map(([ key, value ]) => [
              key,
              [ { label: 'All', value: 0 }, ...(value || []) ]
            ])
          ) as unknown as FilterDropdowns;

          return {
            ...res,
            data: updatedData
          };
        })
      )
  }
}
