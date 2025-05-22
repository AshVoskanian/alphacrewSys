import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Schedule, ScheduleSmsInfo, Vehicle } from "../../../../../shared/interface/schedule";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-vehicles',
  imports: [],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent extends ApiBase {
  @Input() vehicles: Array<Vehicle> = [];
  @Input() scheduleInfo: Schedule;

  @Output() closeModal: EventEmitter<Array<ScheduleSmsInfo> | null> = new EventEmitter<Array<ScheduleSmsInfo> | null>();
  @Output() selectVehicle: EventEmitter<Vehicle> = new EventEmitter<Vehicle>();

  selectedVehicle: Vehicle;
  entireLoading: boolean = false;
  currentLoading: boolean = false;

  setVehicle(vehicle: Vehicle) {
    if (vehicle.loading) return;

    vehicle.loading = true;
    this.selectedVehicle = vehicle;

    this.post(`Schedule/AddOrRemoveJobPartVehicle/${ this.scheduleInfo?.jobPartId }/${ vehicle.vehicleId }`, null)
      .subscribe({
        next: (res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          vehicle.loading = false;
          this.selectVehicle.next(this.selectedVehicle);
          GeneralService.showSuccessMessage();
        })
      })
  }

  getSmsInfo(type: 'current' | 'entire') {
    const jobId = type === 'entire' ? this.scheduleInfo.jobId : 0;
    const jobPartId = this.scheduleInfo.jobPartId;
    this.entireLoading = type === 'entire';
    this.currentLoading = type === 'current';

    this.get<Array<ScheduleSmsInfo>>(`Schedule/SmsJobOrJobPartAsync/${ jobId }/${ jobPartId }`)
      .subscribe({
        next: res => {
          this.entireLoading = this.currentLoading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.closeModal.emit(res.data);
        }
      });
  }
}
