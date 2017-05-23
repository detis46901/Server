import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { User } from '../../_models/user-model'

@Component({
    selector: 'header',
    templateUrl: './header.component.html',
    styleUrls: ['header.component.css'] 
})
export class HeaderComponent { 
    
    constructor() {}
    /*constructor(private renderer: Renderer2) {
    }
    onInit(element: HTMLElement){
        this.renderer.createElement(element, )
    } Maybe this is how to render the static pngs*/

    @Input() user: User
    @Input() isHome = false;
    private isOpen = false;

    public w3_open_close() {
        if(!this.isOpen) {
            document.getElementById("mySidenav").style.display = "block";
            document.getElementById("mySidenav").style.width = "250px";
            document.getElementById("place-input").style.marginLeft = "265px";
            document.getElementById("goto").style.marginLeft = "565px";
            document.getElementById("add-marker").style.marginLeft = "610px";
            document.getElementById("remove-marker").style.marginLeft = "650px";
        }
        else {
            document.getElementById("mySidenav").style.width = "0";
            document.getElementById("place-input").style.marginLeft = "15px";
            document.getElementById("goto").style.marginLeft = "315px";
            document.getElementById("add-marker").style.marginLeft = "360px";
            document.getElementById("remove-marker").style.marginLeft = "400px";
        }
        this.isOpen = !this.isOpen
    }

    /*public w3_close() {
        document.getElementById("mySidenav").style.width = "0";
    }*/
}

//width:250px;background-color: rgba(255,255,255,.7);top:43px; bottom:200px (sidenav specs)