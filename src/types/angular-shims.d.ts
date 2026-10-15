// Declaraciones ambientales para componentes Angular exportables
declare module '@angular/core' {
  export function Component(config: {
    selector?: string;
    standalone?: boolean;
    imports?: any[];
    templateUrl?: string;
    styleUrls?: string[];
    template?: string;
    styles?: string[];
  }): ClassDecorator;

  export interface OnInit {
    ngOnInit(): void;
  }
}

declare module '@angular/common' {
  export const CommonModule: any;
}

declare module '@angular/forms' {
  export const FormsModule: any;
}
