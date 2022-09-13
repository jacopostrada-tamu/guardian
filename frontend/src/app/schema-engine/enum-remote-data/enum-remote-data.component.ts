import { AfterContentInit, Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Dialog allowing you to select a file and load schemas.
 */
@Component({
    selector: 'enum-remote-data',
    templateUrl: './enum-remote-data.component.html',
    styleUrls: ['./enum-remote-data.component.css']
})
export class EnumRemoteData implements AfterContentInit {
    enumValue!: string;

    codeMirrorOptions: any = {
        lineNumbers: true,
        theme: 'default',
        mode: 'text/plain'
    };

    initDialog: boolean = false;
    loading: boolean = false;
    loadToIpfs: boolean = false;
    loadToIpfsValue: boolean = true;

    code: FormControl = new FormControl();
    urlControl = new FormControl("", [
        Validators.pattern(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/)
    ]);


    constructor(
        public dialogRef: MatDialogRef<EnumRemoteData>,
        @Inject(MAT_DIALOG_DATA) public data: {
            enumValue: string[]
        }
    ) {
        this.enumValue = data.enumValue?.join('\n') || "FIRST_OPTION\nSECOND_OPTION\nTHIRD_OPTION";
        this.loadToIpfs = data.enumValue.length > 5;
    }

    ngOnInit() {
    }

    onNoClick(): void {
        this.dialogRef.close(null);
    }

    ngAfterContentInit() {
        setTimeout(() => {
            this.initDialog = true;

            // Allows drop files into text-editor directly
            const dropArea = document.getElementById('text-area');
            dropArea?.addEventListener('dragover', (event) => {
                event.stopPropagation();
                event.preventDefault();
            });
            dropArea?.addEventListener('drop', (event) => {
                event.stopPropagation();
                event.preventDefault();
            });
        }, 150);
    }

    importEnumData(file: any) {
        const reader = new FileReader()
        reader.readAsText(file);
        reader.addEventListener('load', (e: any) => {
            const fileText = e.target.result;
            this.dialogRef.close(new Blob([
                JSON.stringify({
                    enum: [...new Set(fileText.split('\r\n'))]
                })
            ]));
        });
    }

    onImportByUrl() {
        this.loading = true;
        fetch(this.urlControl.value)
            .then(res => {
                if (res.status == 200) {
                    return res.text();
                }
                return new Promise((resolve) => resolve(""));
            })
            .then((jsontext: any) => {
                this.enumValue = jsontext;
            })
            .catch(() => { this.loading = false })
            .finally(() => { this.loading = false });
    }

    onImportByFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt";
        input.onchange = (e: any) => {
            const file: File = e.target?.files[0];
            if (!file) {
                return;
            }
            this.loading = true;
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = (readerEvent: any) => {
                this.loading = false;
                var content = readerEvent?.target?.result || "";
                this.enumValue = content;
            }
        }
        input.click();
    }

    checkLoadIpfsVisible(value: string) {
        const linesCount = (value?.match(/\n/g) || []).length;
        this.loadToIpfs = linesCount > 4;
    }
}