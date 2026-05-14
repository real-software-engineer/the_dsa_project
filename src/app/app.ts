import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api/api.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private http = inject(ApiService);

  ngOnInit() {
    this.http.get('http://jsonplaceholder.typicode.com/posts').subscribe((res: any) => {
      console.log(res);
    });
  }
}
