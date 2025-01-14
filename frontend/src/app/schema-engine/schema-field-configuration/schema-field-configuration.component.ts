import {
    Component,
    Input,
    OnInit,
    SimpleChanges,
    EventEmitter,
    Output
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UnitSystem } from '@guardian/interfaces';
import { ToastrService } from 'ngx-toastr';
import { API_IPFS_GATEWAY_URL } from 'src/app/services/api';
import { IPFSService } from 'src/app/services/ipfs.service';
import { EnumEditorDialog } from '../enum-editor-dialog/enum-editor-dialog.component';
import { FieldControl } from "../field-control";

/**
 * Schemas constructor
 */
@Component({
    selector: 'schema-field-configuration',
    templateUrl: './schema-field-configuration.component.html',
    styleUrls: ['./schema-field-configuration.component.css'],
})
export class SchemaFieldConfigurationComponent implements OnInit {
    @Input('form') form!: FormGroup;
    @Input('field') field!: FieldControl;

    @Input('types') types!: any[];
    @Input('measureTypes') measureTypes!: any[];
    @Input('schemaTypes') schemaTypes!: any[];
    @Input('extended') extended!: boolean;

    @Output('remove') remove = new EventEmitter<any>();

    unit: boolean = true;
    enum: boolean = false;
    loading: boolean = false;
    keywords: string[] = [];

    constructor(
        public dialog: MatDialog,
        private ipfs: IPFSService,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        const enumValues = this.field.controlEnum.value
        if (enumValues && enumValues.length) {
            for (let i=0;i<enumValues.length && i<5; i++) {
                this.keywords.push(enumValues[i]);
            }
        }

        const remoteLinkValue = this.field.controlRemoteLink.value;
        if (remoteLinkValue) {
            this.loadRemoteEnumData(remoteLinkValue);
        }
    }

    updateControlEnum(values: string[]) {
        if (!values) {
            return;
        }

        this.field.controlEnum.clear();
        values.forEach((item: any) => {
            this.field.controlEnum.push(new FormControl(item));
        });

        this.keywords = [];
        if (values && values.length) {
            for (let i = 0; i < values.length && i < 5; i++) {
                this.keywords.push(values[i]);
            }
        }
    }

    loadRemoteEnumData(link:string) {
        this.loading = true;
        fetch(link)
            .then(r=> r.json())
            .then((res: any) => {
                if (!res) {
                    return;
                }
                this.updateControlEnum(res.enum);
            })
            .catch((err) => this.errorHandler(err.message, 'Can not load remote enum data'))
            .finally(() => this.loading = false);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.extended && Object.keys(changes).length === 1) {
            return;
        } 
        const type = this.field.controlType.value;
        this.onTypeChange(type);
    }

    ngOnDestroy() {
    }

    onRemove(field: any) {
        this.remove.emit(field);
    }

    onTypeChange(event: any) {
        const item = this.types.find(e => e.value == event);
        if (item && item.name == 'Boolean') {
            this.field.controlArray.setValue(false);
            this.field.controlArray.disable();
        } else {
            this.field.controlArray.enable();
        }
        this.unit = event == UnitSystem.Prefix || event == UnitSystem.Postfix;

        this.enum = (item && item.name || event) === 'Enum';
        if (this.enum) {
            this.field.controlEnum.setValidators([Validators.required]);
        } else {
            this.field.controlEnum.clearValidators();
        }
        this.field.controlEnum.updateValueAndValidity();
    }

    onEditEnum() {
        const dialogRef = this.dialog.open(EnumEditorDialog, {
            panelClass: 'g-dialog',
            width: "700px",
            data: {
                enumValue: this.field.controlEnum.value,
                errorHandler: this.errorHandler.bind(this)
            }
        });
        dialogRef.afterClosed().subscribe((res: { enumValue: string, loadToIpfs: boolean }) => {
            if (!res) {
                return;
            }
            this.field.controlRemoteLink.patchValue("");

            const uniqueTrimmedEnumValues: string[] = [
                ...new Set(
                    res.enumValue
                        .split('\n')
                        .map(item => item.trim())
                )
            ] as string[];

            if (res.loadToIpfs && uniqueTrimmedEnumValues.length > 5) {
                this.field.controlEnum.clear();
                this.loading = true;
                this.ipfs.addFile(new Blob([
                    JSON.stringify({
                        enum: uniqueTrimmedEnumValues
                    })
                ])).subscribe(cid => {
                    this.loading = false;
                    const link = API_IPFS_GATEWAY_URL + cid;
                    this.field.controlRemoteLink.patchValue(link);
                    this.loadRemoteEnumData(link);
                }, (err) => { 
                    this.loading = false;
                    this.errorHandler(err.message, 'Enum data can not be loaded to IPFS');
                    this.updateControlEnum(uniqueTrimmedEnumValues);
                });
            } else {
                this.updateControlEnum(uniqueTrimmedEnumValues);
            }
        });
    }

    private errorHandler(errorMessage: string, errorHeader: string): void {
        this.toastr.error(errorMessage, errorHeader, {
            timeOut: 30000,
            closeButton: true,
            positionClass: 'toast-bottom-right',
            enableHtml: true
        });
    }
}
