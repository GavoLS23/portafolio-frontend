import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should configure TestBed', () => {
    expect(TestBed).toBeTruthy();
  });
});
