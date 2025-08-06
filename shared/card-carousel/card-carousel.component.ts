import { Component, Input, OnInit, TemplateRef, ContentChild } from '@angular/core';

@Component({
  selector: 'app-card-carousel',
  templateUrl: './card-carousel.component.html',
  styleUrls: ['./card-carousel.component.css']
})
export class CardCarouselComponent<item = any> implements OnInit {

  @Input() items: item[] = [];
  @Input() sectionTitle: string = '';
  @Input() sectionHint: string = '';
  @Input() viewAllText: string = '';
  @Input() viewAllLink: string = ''; 
  @ContentChild('cardTemplate') cardTemplate!: TemplateRef<any>;

  ngOnInit() {
    console.log('Items received by carousel:', this.items);
  }
}