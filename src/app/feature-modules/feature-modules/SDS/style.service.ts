import { Injectable } from '@angular/core';
import { UserPageLayer, MyCubeField } from '_models/layer.model';
import { UserPageInstance } from '_models/module.model'
import { MapConfig, mapStyles, featureList } from 'app/map/models/map.model';
import { geoJSONService } from 'app/map/services/geoJSON.service';
import { SDSStyles } from './SDS.model'
import { MatSnackBar } from '@angular/material/snack-bar';
//http dependancies
import { HttpClient, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable ,  Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SQLService } from '../../../../_services/sql.service';
import { MyCubeService } from '../../../map/services/mycube.service'
import { Router } from '@angular/router'
import Feature from 'ol/Feature';
import {Fill, Stroke, Circle, Style} from 'ol/style';




@Injectable()
export class StyleService {
    private locateStyles = new SDSStyles
    public styleFunction(feature: Feature, version: string): Style {
        let style = new Style({
            image: new Circle({
                radius: this.getDepthRadius(feature),
                stroke: new Stroke({
                    color: '#fff'
                }),
                fill: new Fill({
                    color: this.getFillColor(feature, version)
                })
            }),
            stroke: new Stroke({
                color: this.getFillColor(feature, version),
                width: 2
            })
        });
        return style
    }

    getDepthRadius(feature: Feature): number {
        let depthRadius: number
        let depth: string = feature.get("depth")
        let depthNum: number
        try {
            if (depth.includes("FEET")) {
                depthNum = +depth.split("FEET")[0]
            }
            if (depth.includes("FT")) {
                depthNum = +depth.split("FT")[0]
            }
            if (depthNum < 4) {
                depthRadius = 6
            }
            else {
                depthRadius = 10
            }
        }
        catch{
            depthRadius = 10
        }
        return depthRadius
    }

    getFillColor(feature: Feature, version: string): string {
        let getFillColor: string
        let d: string = feature.get('sdate')
        let t: string = (feature.get('stime'))
        let dt = new Date(d + ' ' + feature.get('stime'))
        // console.log(dt)
        let now = new Date()

        if (version == 'load') {
            return '#3399CC'
        }
        if (version == 'current') {
            return '#0000FF'
        }
        if (version == 'selected') {
            return '#FF0000'
        }


        return getFillColor
    }
}
