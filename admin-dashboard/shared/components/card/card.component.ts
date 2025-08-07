import { Component, ContentChild, ElementRef, TemplateRef, Input  } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {

  @Input() cardTitle: string | undefined;

  @Input() cardClass: string | undefined;

  @Input() showContent: boolean = true;
  @Input() blockClass: string | undefined;

  @Input() headerClass: string | undefined;
  @Input() showHeader: boolean = true;

  @Input() padding: number = 20; // set default to 20 px

  @ContentChild('headerOptionsTemplate') headerOptionsTemplate!: TemplateRef<ElementRef>;
  @ContentChild('headerTitleTemplate') headerTitleTemplate!: TemplateRef<ElementRef>;

}
