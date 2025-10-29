import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { ApiBase } from "../../../shared/bases/api-base";

@Injectable({
  providedIn: 'root'
})
export class CrewService extends ApiBase {
  getDetail(id: number): Observable<any> {
    return this.get<any>(`/Crew/GetCrewByCrewId?crewId=${ id }`)
  }
}
