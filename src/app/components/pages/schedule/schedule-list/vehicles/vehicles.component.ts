import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Schedule, Vehicle } from "../../../../../shared/interface/schedule";
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

  @Output() closeModal: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() selectVehicle: EventEmitter<Vehicle> = new EventEmitter<Vehicle>();

  selectedVehicle: Vehicle;

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
}
