import { Injectable } from '@angular/core';
import { DropdownOption } from '../components/resuable/dropdown/dropdown.component';

@Injectable({
    providedIn: 'root'
})
export class MasterDataService {
    getMonthOptions(): DropdownOption[] {
        return [
            { label: 'January', value: 1 },
            { label: 'February', value: 2 },
            { label: 'March', value: 3 },
            { label: 'April', value: 4 },
            { label: 'May', value: 5 },
            { label: 'June', value: 6 },
            { label: 'July', value: 7 },
            { label: 'August', value: 8 },
            { label: 'September', value: 9 },
            { label: 'October', value: 10 },
            { label: 'November', value: 11 },
            { label: 'December', value: 12 },
        ];
    }

    getYearOptions(startYear = 2023, endYear = new Date().getFullYear()): DropdownOption[] {
        const options: DropdownOption[] = [];
        for (let year = endYear; year >= startYear; year--) {
            options.push({ label: String(year), value: year });
        }
        return options;
    }

    getNoticeTypeOptions(): DropdownOption[] {
        return [
            { label: 'Announcement', value: 'announcement' },
            { label: 'Alert', value: 'alert' },
            { label: 'Event', value: 'event' },
            { label: 'Maintenance', value: 'maintenance' }
        ];
    }
}

