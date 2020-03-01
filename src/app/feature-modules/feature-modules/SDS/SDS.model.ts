import {Fill, Stroke, Circle, Style} from 'ol/style';
import Text from 'ol/style/Text';
import { Subject } from 'rxjs/Subject';
import { UserPageLayer, MyCubeField, MyCubeComment } from '_models/layer.model';


export class SDSConfig {
    moduleInstanceID: number
    expanded: boolean
    moduleName: string
    moduleSettings: JSON
    filter: string;
    label: string;
    list = new Array<any>()
    tab: string
    sortBy: string = "Address"
    itemData = new Array<MyCubeField>()
    selectedItem: number = 0
    selectedItemLog: MyCubeComment[]
    linkedField: string
    editRecordDisabled: boolean = true
    showLog: boolean = false
}

export class SDSStyles {
    public load = new Style({
        image: new Circle({
            radius: 10,
            stroke: new Stroke({
                color: '#fff'
            }),
            fill: new Fill({
                color: '#3399CC'
            })
        }),
        // text: new ol.style.Text({
        //   text: '1',
        //   fill: new ol.style.Fill({
        //     color: '#fff'
        //   })
        // })
    });

    public current = new Style({
        image: new Circle({
            radius: 10,
            stroke: new Stroke({
                color: '#fff'
            }),
            fill: new Fill({
                color: '#0000FF'
            })
        }),
        // text: new ol.style.Text({
        //   text: '1',
        //   fill: new ol.style.Fill({
        //     color: '#fff'
        //   })
        // })
    });

    public selected = new Style({
        image: new Circle({
            radius: 10,
            stroke: new Stroke({
                color: '#fff'
            }),
            fill: new Fill({
                color: '#FF0000'
            })
        }),
        // text: new ol.style.Text({
        //   text: '1',
        //   fill: new ol.style.Fill({
        //     color: '#fff'
        //   })
        // })
    });

}