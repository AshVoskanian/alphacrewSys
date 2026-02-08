import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-jobpart',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbAccordionModule
  ],
  templateUrl: './add-jobpart.component.html',
  styleUrl: './add-jobpart.component.scss'
})
export class AddJobpartComponent {
  private readonly _fb = inject(FormBuilder);

  jobId = input<number>();

  cancel = output<void>();
  save = output<void>();

  activeNotesTab = 1;

  jobPartTypes: Select2Option[] = [
    { value: 1, label: 'CREW' },
    { value: 2, label: 'MAN&VAN (LUTON)' },
    { value: 3, label: 'MAN&VAN (TRANSIT)' },
    { value: 4, label: 'SECURITY' },
    { value: 5, label: 'SECURITY (EVENT)' },
    { value: 6, label: 'SECURITY (SITE)' },
    { value: 7, label: 'OFFICE' },
  ];

  hoursOptions: Select2Option[] = Array.from({ length: 25 }, (_, i) => ({
    value: i,
    label: `${i} Hour${i !== 1 ? 's' : ''}`
  }));

  crewOptions: Select2Option[] = Array.from({ length: 21 }, (_, i) => ({
    value: i,
    label: `${i} Crew`
  }));

  travelHoursOptions = Array.from({ length: 13 }, (_, i) => ({
    value: i,
    label: `${i}hrs`
  }));

  form: FormGroup = this._fb.group({
    jobPartTypeId: [1],
    startDate: [null],
    time: [null],
    jobPartHours: [10],
    crewNumber: [6],
    crewChiefNumber: [0],
    ccSupplement: [null],

    // OOT - Out of town / travel costs
    travelHours: [0],
    travelHoursCost: [0],
    returnMileage: [0],
    ootCost: [0],
    lateShiftCost: [0],
    fuelCost: [0],
    fuelCostCrew: [0],

    // Extra hours
    extraCrew: [0],
    extraHours: [0],
    extraCost: [0],

    // Miscellaneous costs
    misc: [null],
    miscCost: [0],
    fuel: [0],
    skillSupplement: [0],

    // Venue / Contact
    jobPartVenueName: [null],
    jobPartVenuePostcode: [null],
    onsiteContact: [null],
    alphaDrivers: [0],

    // Notes
    importantNotes: [false],
    notes: [null],
    crewNotes: [null],
    skillsNotes: [null],
    paperworkNotes: [null],

    // Flags
    lateChange: [false],

    // Skills
    skillDriver: [false],
    skillForklift: [false],
    skillIpaf: [false],
    skillIpaf3b: [false],
    skillSafety: [false],
    skillConstruction: [false],
    skillCarpenter: [false],
    skillLightning: [false],
    skillSound: [false],
    skillVideo: [false],
    skillTfm: [false],
    skillTelehandler: [false],
    skillScissorlift: [false],
    skillCherrypicker: [false],
    skillFirstAid: [false],
    skillPasma: [false],
    skillFollowspot: [false],
    skillAudioTech: [false],
    skillRoughTerrainForklift: [false],
    skillHealhAndSafety: [false],
    skillWorkingAtHeight: [false],
  });
}
