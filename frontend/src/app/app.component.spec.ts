import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            getQueue: () => of([])
          }
        }
      ]
    }).compileComponents();
  });

  it('renders the OPD Desk brand and nav links', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('OPD Desk');
    expect(el.querySelector('a[routerLink="/register"]')).toBeTruthy();
    expect(el.querySelector('a[routerLink="/queue"]')).toBeTruthy();
  });
});
