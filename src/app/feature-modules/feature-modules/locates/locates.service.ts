import { Injectable } from '@angular/core';
import { UserPageLayer, MyCubeField } from '_models/layer.model';
import { MapConfig, featureList } from 'app/map/models/map.model';
import { geoJSONService } from 'app/map/services/geoJSON.service';
import { Locate, locateStyles, locateConfig } from './locates.model'
import { DataFormConfig, LogFormConfig, LogField } from '../../../shared.components/data-component/data-form.model'
import { StyleService } from './style.service'
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import { SQLService } from './../../../../_services/sql.service';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from "ol/layer/Vector";
import VectorSource from 'ol/source/Vector';
import {transform} from 'ol/proj';
import { environment } from '../../../../environments/environment'
import { DataFormService } from '../../../shared.components/data-component/data-form.service'
import { UserPage } from '_models/user.model';


@Injectable()
export class LocatesService {
  public layerState: string
  public locate: Locate
  public mapConfig: MapConfig
  public filter: string = 'closed IS Null'
  public sortBy: string = "Address"
  public showSortBy: Boolean
  
  constructor(private geojsonservice: geoJSONService,
    protected _http: HttpClient,
    private styleService: StyleService,
    private sqlService: SQLService,
    private dataFormService: DataFormService,
    private snackBar: MatSnackBar) {}

  //loads the locate data
  public loadLayer(mapConfig: MapConfig, layer: UserPageLayer): boolean {
    this.mapConfig = mapConfig
    //Need to provide for clustering if the number of objects gets too high
    let stylefunction = ((feature: Feature) => {
      return (this.styleService.styleFunction(feature, 'load'));
    })
    let source = new VectorSource({
      format: new GeoJSON()
    })
    let vectorlayer = new VectorLayer({
      source: source,
      style: stylefunction
    });
    layer.olLayer = vectorlayer
    // layer.source = source
    this.getMyLocateData(layer).then((loadedLayer:UserPageLayer) => {
      // var clusterSource = new ol.source.Cluster({
      //   distance: 90,
      //   source: source
      // });
      // loadedLayer.olLayer.source = loadedLayer.source
      loadedLayer.olLayer.setVisible(layer.defaultON);
      this.mapConfig.map.addLayer(loadedLayer.olLayer);
    })
    this.createInterval(layer)
    return true
  }


  public createInterval(layer: UserPageLayer) {
    clearInterval(layer.updateInterval)
    layer.updateInterval= setInterval(() => {
      this.reloadLayer(layer);
    }, 20000);
  }

  
  public getFeatureList(layer?:UserPageLayer): boolean {
    let k: number = 0;
    let tempList = new Array<featureList>();
    try {
      layer.olLayer.getSource().forEachFeature((x: Feature) => {
        let i = layer.olLayer.getSource().getFeatures().findIndex((j) => j == x);
        let fl = new featureList;
        fl.id = x.get('id')
        if (x.get("address") == "") { fl.label = x.get("street") + " and " + x.get("crossst") }
        else {
          fl.label = x.get("address") + " " + x.get("street")
        }
        fl.feature = x
        if (i > -1 && fl != null) {
          tempList.push(fl)
          k += 1
        }
      })
      this.mapConfig.featureList = tempList.slice(0, k)
      this.sortByFunction()
    } catch (error) {
      console.error(error);
      clearInterval(layer.updateInterval);
    }
    return true
  }

  public setCurrentLayer(layer: UserPageLayer): boolean {
    this.showSortBy = true
    this.reloadLayer(layer)
    return true
  }

  public unsetCurrentLayer(layer: UserPageLayer): boolean {
    this.reloadLayer(layer, 'load')
    this.showSortBy = false
    return true
  }

  public selectFeature(layer: UserPageLayer): boolean {
    clearInterval(layer.updateInterval)
    layer.updateInterval= null
    return false
  }

  public clearFeature(layer: UserPageLayer): boolean {
    // let stylefunction = ((feature: Feature, resolution) => {  //"resolution" has to be here to make sure feature gets the feature and not the resolution
    //   console.log('clearing feature')
    //   return (this.styleService.styleFunction(feature, 'current'));
    // })
    this.createInterval(layer)
    this.locate = null
    // this.reloadLayer(layer, 'current')
  //  if (this.mapConfig.selectedFeature) { this.mapConfig.selectedFeature.setStyle(stylefunction) }
   this.mapConfig.myCubeConfig = new DataFormConfig
        this.mapConfig.myCubeComment = new LogFormConfig
    return false
  }

  public styleSelectedFeature(layer: UserPageLayer): boolean {
    // let stylefunction = ((feature: Feature, resolution) => {  //"resolution" has to be here to make sure feature gets the feature and not the resolution
    //   return (this.styleService.styleFunction(feature, 'selected'));
    // })
    this.mapConfig.selectedFeature.setStyle(this.styleService.styleFunction(this.mapConfig.selectedFeature, 'selected'))
    return true
  }

  public unstyleSelectedFeature(layer: UserPageLayer): boolean {
    let stylefunction = ((feature: Feature, resolution) => {  //"resolution" has to be here to make sure feature gets the feature and not the resolution
      return (this.styleService.styleFunction(feature, 'current'));
    })
    if (this.mapConfig.selectedFeature) {this.mapConfig.selectedFeature.setStyle(stylefunction)}
    return true
  }

  //Procedures specific to locates are below...
  public reloadLayer(layer: UserPageLayer, layerState?: string) {
    if (!layerState) {
      layerState = 'load'
      if (layer == this.mapConfig.currentLayer) {layerState = 'current'}
    }
    this.getMyLocateData(layer).then((loadedLayer:UserPageLayer) => {
        if (layerState == 'current') {this.getFeatureList(layer)}
          layer.olLayer.getSource().forEachFeature((feat: Feature) => {
            feat.setStyle(this.styleService.styleFunction(feat, layerState));
          })
    })
  }

  public getOneLocate(layer: UserPageLayer):Promise<Locate> {
    let promise = new Promise<Locate>((resolve) => {
      this.sqlService.GetSingle('mycube.t' + layer.layerID, this.mapConfig.selectedFeature.get('id'))
      .subscribe((data) => {
        resolve(data[0][0])
      })
    })
    return promise
  }

  private getMyLocateData(layer: UserPageLayer): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.geojsonservice.GetSome(layer.layer.ID, this.filter)
        .subscribe((data: any) => { //GeoJSON.Feature<any>
          if (data[0][0]['jsonb_build_object']['features']) {
            layer.olLayer.getSource().clear()
            layer.olLayer.getSource().addFeatures(new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }).readFeatures(data[0][0]['jsonb_build_object']))
          }
          resolve(layer);
        })
    })
    return promise;
  }

  public parseLocateInput(Loc: string, MapConfig: MapConfig, instanceID: number): void {
    this.mapConfig = MapConfig
    let locate = new Locate
    let i: number
    let ii: number
    try {
      let tp = Loc.split("CNCL")
      if (tp.length > 1) {locate.cancel = true}
      let t = Loc.split("Ticket : ")
      locate.ticket = t[1].substr(0, 10)
      t = Loc.split("Date: ")
      locate.tdate = t[1].substr(0, 10)
      t = Loc.split("Time: ")
      locate.ttime = t[1].substr(0, 5)
      t = Loc.split("Subdivision:")
      locate.subdivision = t[1].split("Address :")[0]

      i = Loc.indexOf("Address :")
      ii = Loc.indexOf("Street  :")
      if (i + 16 > ii) { locate.address = Loc.substring(i + 10, ii - 1) } else { locate.address = '' }
      i = Loc.indexOf("Street  :")
      ii = Loc.indexOf("Cross ")
      if (ii < 5) { ii = Loc.indexOf("Location") }
      locate.street = Loc.substr(i + 10, ii - i - 11)
      i = Loc.indexOf("Cross ")
      locate.crossst = ""
      if (i < 5) { locate.crossst = "" }
      else {
        ii = Loc.indexOf("Within")
        locate.crossst = Loc.substr(i + 10, ii - i - 11)
      }

      let Addname: string
      if (locate.address.length > 3) {
        Addname = locate.address + " " + locate.street + " Kokomo, IN"
      }
      else {
        Addname = locate.street + " and " + locate.crossst + " Kokomo, IN"
      }

      i = Loc.indexOf("Location")
      ii = Loc.indexOf("Grids")
      locate.location = Loc.substr(i + 10, ii - 2 - i - 10)

      i = Loc.indexOf("Boundary")
      let BN = Loc.substring(i + 12, i + 21)
      let BS = Loc.substring(i + 27, i + 36)
      let BW = Loc.substring(i + 42, i + 52)
      let BE = Loc.substring(i + 58, i + 68)

      //not sure I need this
      let Boundary = BW + " " + BN + "," + BE + " " + BN + "," + BE + " " + BS + "," + BW + " " + BS + "," + BW + " " + BN

      i = Loc.indexOf("Work type")
      ii = Loc.indexOf("Done for")

      locate.wtype = Loc.substring(i + 12, ii - 1)

      i = Loc.indexOf("Done for")
      ii = Loc.indexOf("Start date")
      locate.dfor = Loc.substring(i + 12, ii - 1)

      i = Loc.indexOf("Start date")
      locate.sdate = Loc.substring(i + 12, i + 22)
      locate.stime = Loc.substring(i + 30, i + 35)

      i = Loc.indexOf("Priority")
      locate.priority = Loc.substring(i + 10, i + 14)

      i = Loc.indexOf("Blasting:")
      let BlastingYN = Loc.substring(i + 10, i + 11)
      if (BlastingYN == "Y") {
        locate.blasting = 't'
      }
      else {
        locate.blasting = 'f'
      }

      i = Loc.indexOf("Boring:")
      if (Loc.substring(i + 8, i + 9) == 'Y') { locate.boring = 't' }
      else { locate.boring = 'f' }

      i = Loc.indexOf("Railroad:")
      if (Loc.substring(i + 10, i + 11) == "Y") { locate.railroad = 't' }
      else { locate.railroad = 'f' }

      i = Loc.indexOf("Emergency: ")
      if (Loc.substring(i + 11, i + 12) == "Y") { locate.emergency = 't' }
      else { locate.emergency = 'f' }

      i = Loc.indexOf("Duration  :")
      ii = Loc.indexOf("Depth:")
      locate.duration = Loc.substring(i + 12, ii - 1)

      i = Loc.indexOf("Depth:")
      ii = Loc.indexOf("Company :")
      locate.depth = Loc.substring(i + 7, ii - 2)

      i = Loc.indexOf("Company :")
      ii = Loc.indexOf("Type:")
      locate.company = Loc.substring(i + 10, ii - 1)

      i = Loc.indexOf("Type:")
      ii = Loc.indexOf("Co addr :")
      locate.ctype = Loc.substring(i + 6, ii - 1)

      i = Loc.indexOf("Co addr")
      ii = Loc.indexOf("City    :")
      locate.coaddr = Loc.substring(i + 10, ii - 1)

      i = Loc.indexOf("City    :")
      ii = Loc.indexOf("Zip:")
      locate.cocity = Loc.substring(i + 10, ii - 10)

      i = Loc.indexOf("Zip:")
      ii = Loc.indexOf("Caller  : ")
      locate.cozip = Loc.substring(i + 5, ii - 1)

      i = Loc.indexOf("Caller  : ")
      ii = Loc.indexOf("Phone:")
      locate.caller = Loc.substring(i + 10, ii - 1)

      i = Loc.indexOf("Phone:")
      ii = Loc.indexOf("Contact :")
      if (ii < 5) {
        ii = Loc.indexOf("BestTime")
      }
      locate.callphone = Loc.substring(i + 7, ii - 1)

      i = Loc.indexOf("Contact :")
      if (i < 5) { locate.contact = "" }
      else {
        ii = Loc.lastIndexOf("Phone:")
        locate.contact = Loc.substring(i + 10, ii - 1)
      }

      i = Loc.indexOf("Mobile  :")
      if (i < 5) { locate.mobile = "" }
      else {
        ii = Loc.indexOf("Fax")
        if (ii > 0) {
          locate.mobile = Loc.substring(i + 10, ii - 1)
        }
        else {
          locate.mobile = Loc.substring(i + 10, i + 23)
        }
      }

      i = Loc.indexOf("Fax  ")
      ii = Loc.indexOf("Email  ")
      if (i > 0) {
        if (ii > 0) {
          locate.fax = Loc.substring(i + 10, ii - 1)
        }
        else {
          locate.fax = Loc.substring(i + 10, i + 23)
        }
      }
      else {
        locate.fax = ""
      }

      i = Loc.indexOf("Email  ")
      ii = Loc.indexOf("Remarks ")
      if (i > 0) {
        locate.email = Loc.substring(i + 10, ii - 2)
      }
      else {
        locate.email = ""
      }
      this.locate = locate
      this.geojsonservice.GetSome(this.mapConfig.currentLayer.layer.ID, "ticket = '" + locate.ticket + "'")
        .subscribe((x) => {
          if (x[0][0]['features']) {
            let snackBarRef = this.snackBar.open('Ticket was not inserted.  It is a duplicate.', '', {
              duration: 4000
            });
          }
          else {
            this.geolocate(Addname, instanceID)
          }
        })
    }
    catch (e) {
      let snackBarRef = this.snackBar.open('Locate email is not formed correctly.', '', {
        duration: 4000
      });
    }
  }

  private geolocate(addName: string, instanceID: number) {
    console.log('geolocate')
    let geometry: JSON
    let httpP = new HttpParams()
    httpP = httpP.append("address", addName)
    httpP = httpP.append("components", "administrative_area:Howard")
    httpP = httpP.append("sensor", "false")
    httpP = httpP.append("key", "AIzaSyDAaLEIXTo6am6x0-QlegzxDnZLIN3mS-o")
    this.GetGeoLocation(httpP)
      .subscribe((results: string) => {
        let i = results.indexOf('<lat>')
        let ii = results.indexOf('</lat>')
        let lat = results.substring(i + 5, ii - 1)
        i = results.indexOf('<lng')
        ii = results.indexOf('</lng>')
        let lng = results.substring(i + 5, ii - 1)
        geometry = JSON.parse('{"type":"Feature","geometry":{"type":"Point","coordinates":[' + lng + ',' + lat + ']},"properties":null}')
        i = this.mapConfig.userpageinstances.findIndex(x => x.moduleInstanceID == instanceID)
        let obj = this.mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'myCube Layer Identity (integer)')
        let table: number = obj['setting']['value']
        this.addRecord(table, geometry)
      })
  }

  public GetGeoLocation = (params: HttpParams): Observable<string> => {
    console.log('getGeolocation')
    let options: any = {
      headers: new HttpHeaders({
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      })
    }
    return this._http.get<string>('https://maps.googleapis.com/maps/api/geocode/xml', { params: params, headers: options, responseType: 'text' as 'json' })
  }

  public addRecord(table, geometry: JSON) {
    this.sqlService.addRecord(table, geometry)
      .subscribe(data => {
        let id = data[0][0]['id']
        this.updateRecord(table, id, 'ticket', 'text', this.locate.ticket)
        this.updateRecord(table, id, 'tdate', 'date', this.locate.tdate)
        this.updateRecord(table, id, 'ttime', 'date', this.locate.ttime)
        this.updateRecord(table, id, 'subdivision', 'text', this.locate.subdivision)
        this.updateRecord(table, id, 'address', 'text', this.locate.address)
        this.updateRecord(table, id, 'street', 'text', this.locate.street)
        this.updateRecord(table, id, 'crossst', 'text', this.locate.crossst)
        this.updateRecord(table, id, 'location', 'text', this.locate.location)
        this.updateRecord(table, id, 'wtype', 'text', this.locate.wtype)
        this.updateRecord(table, id, 'dfor', 'text', this.locate.dfor)
        this.updateRecord(table, id, 'sdate', 'date', this.locate.sdate)
        this.updateRecord(table, id, 'stime', 'date', this.locate.stime)
        this.updateRecord(table, id, 'priority', 'text', this.locate.priority)
        this.updateRecord(table, id, 'blasting', 'text', this.locate.blasting)
        this.updateRecord(table, id, 'boring', 'text', this.locate.boring)
        this.updateRecord(table, id, 'railroad', 'text', this.locate.railroad)
        this.updateRecord(table, id, 'emergency', 'text', this.locate.emergency)
        this.updateRecord(table, id, 'duration', 'text', this.locate.duration)
        this.updateRecord(table, id, 'depth', 'text', this.locate.depth)
        this.updateRecord(table, id, 'company', 'text', this.locate.company)
        this.updateRecord(table, id, 'ctype', 'text', this.locate.ctype)
        this.updateRecord(table, id, 'coaddr', 'text', this.locate.coaddr)
        this.updateRecord(table, id, 'cocity', 'text', this.locate.cocity)
        this.updateRecord(table, id, 'cozip', 'text', this.locate.cozip)
        this.updateRecord(table, id, 'caller', 'text', this.locate.caller)
        this.updateRecord(table, id, 'callphone', 'text', this.locate.callphone)
        this.updateRecord(table, id, 'contact', 'text', this.locate.contact)
        this.updateRecord(table, id, 'mobile', 'text', this.locate.mobile)
        this.updateRecord(table, id, 'fax', 'text', this.locate.fax)
        this.updateRecord(table, id, 'email', 'text', this.locate.email)
        this.reloadLayer(this.mapConfig.currentLayer)
        this.zoomToFeature(id, geometry)
      })
  }

  public zoomToFeature(id: number, geometry: JSON) {
    this.mapConfig.view.animate({ zoom: 17, center: transform([geometry['geometry']['coordinates'][0], geometry['geometry']['coordinates'][1]], 'EPSG:4326', 'EPSG:3857') })
  }

  public updateRecord(table: number, id: string, field: string, type: string, value: string): boolean {
    let mcf = new MyCubeField
    mcf.field = field
    mcf.type = type
    mcf.value = value
    this.sqlService.Update(table, id, mcf)
      .subscribe(data => {
        //This is to check for duplicates.  There's got to be a better way to do this.
        if (field == 'ticket') {
          this.sqlService.GetSingle('mycube.t' + table, id)
            .subscribe((x) => {
              let y: Locate = x[0][0]
              if (y.ticket != null) {
                let snackBarRef = this.snackBar.open('Ticket ' + this.locate.ticket + ' was inserted.', 'Undo', {
                  duration: 4000
                });
                let logForm = new LogField
                logForm.comment = "Ticket Added"
                logForm.logTable = 'c' + table
                logForm.schema = 'mycube'
                logForm.userid = this.mapConfig.user.ID
                logForm.featureid = id   
                logForm.auto = true             
                this.dataFormService.addLogForm(logForm)
                snackBarRef.onAction().subscribe((x) => {
                  this.sqlService.Delete(table, id)
                    .subscribe((x) => {
                      let newSnackBarRef = this.snackBar.open("Undone")
                    })
                })
              }
              else {
                //Code should never get to this point.  There is another check further up.
                let snackBarRef = this.snackBar.open('Ticket was not inserted.  It is a duplicate.', '', {
                  duration: 4000
                });
                this.sqlService.Delete(table, id)
                  .subscribe((x) => {

                  })
              }
            })
        }
        // this.reloadLayer();
      })
    return true
  }

  public completeTicket(mapConfig: MapConfig, instanceID: number, ticket: Locate, completedNote: string, completedBy: string) {
    let ticketID = ticket.id.toString()
    this.mapConfig = mapConfig
    let undo: boolean
    let i = mapConfig.userpageinstances.findIndex(x => x.moduleInstanceID == instanceID)
    let obj = mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'myCube Layer Identity (integer)')
    let table: number = obj['setting']['value']
    let strDate = new Date()
    i = mapConfig.userpagelayers.findIndex(x => x.layerID == table)
    let feat: Feature = this.mapConfig.selectedFeature
    this.mapConfig.currentLayer.olLayer.getSource().removeFeature(this.mapConfig.selectedFeature)
    this.clearFeature(mapConfig.userpagelayers[i])
    let flItemIndex: number = this.mapConfig.featureList.findIndex(x => x.feature == feat)
    let flItem: featureList = this.mapConfig.featureList.splice(flItemIndex)[0]
    let snackBarRef = this.snackBar.open('Ticket completed.', 'Undo', {
      duration: 4000
    });
    snackBarRef.onAction().subscribe((x) => {
      undo = true
      this.mapConfig.selectedFeature = feat
      this.mapConfig.currentLayer.source.addFeature(this.mapConfig.selectedFeature)
      this.selectFeature(this.mapConfig.currentLayer)
      let snackBarRef = this.snackBar.open('Undone.', '', {
        duration: 4000
      });

    })
    snackBarRef.afterDismissed().subscribe((x) => {
      if (!undo) {
        this.updateRecord(table, ticketID, 'closed', 'text', strDate.toLocaleString())
        let ntext: RegExp = /'/g
        if (completedNote) { completedNote = completedNote.replace(ntext, "''") }
        this.updateRecord(table, ticketID, 'note', 'text', completedNote)
        this.updateRecord(table, ticketID, 'completedby', 'text', completedBy)
        this.updateRecord(table, ticketID, 'disposition', 'text', ticket.disposition)
        undo = false
        this.sendUpdateToIRTH(instanceID, ticket)
        this.reloadLayer(this.mapConfig.currentLayer, "current")
      }
    })
  }

  sendUpdateToIRTH(instanceID: number, ticket: Locate) {
    let i = this.mapConfig.userpageinstances.findIndex(x => x.moduleInstanceID == instanceID)
    let stateCode = this.mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'State Code')
    let userID = this.mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'UserID')
    let password = this.mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'Password')
    let serviceAreaCode = this.mapConfig.userpageinstances[i].module_instance.settings['settings'].find(x => x['setting']['name'] == 'Service Area Code')
    stateCode = stateCode['setting']['value']
    userID = userID['setting']['value']
    password = password['setting']['value']
    serviceAreaCode = serviceAreaCode['setting']['value']

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', environment.proxyUrl + '/irth.indiana811.org/IrthOneCallWebServices/PositiveResponseV2.asmx', true);

    var sr =
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <Respond xmlns="http://Irth.com/OneCall/PositiveResponse">
        <occCode>` + stateCode + `</occCode>
        <userID>` + userID + `</userID>
        <password>` + password + `</password>
        <serviceAreaCode>` + serviceAreaCode + `</serviceAreaCode>
        <occTicketID>` + ticket.ticket + `</occTicketID>
        <responseCode>` + ticket.disposition + `</responseCode>
        <responseCategory></responseCategory>
        <comment>Auto Response by the City of Kokomo</comment>
      </Respond>
    </soap:Body>
  </soap:Envelope>`

    xmlhttp.onreadystatechange =  () => {
      console.log(xmlhttp.responseText)
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var xml = xmlhttp.responseXML;
                var req = xmlhttp.responseURL
                console.log(req)
                console.log(xml); //I'm printing my result square number
            }
        }
    }
    // Send the POST request
    xmlhttp.setRequestHeader('Content-Type', 'text/xml');
    xmlhttp.send(sr)
}

  public flipSortBy() {
    switch (this.sortBy) {
      case "Priority": {
        this.sortBy = "Address"
        break
      }
      case "Address": {
        this.sortBy = "Contractor"
        break
      }
      case "Contractor": {
        this.sortBy = "Priority"
      }
    }
    this.sortByFunction()
  }

  public sortByFunction() {
    if (this.sortBy == "Address") { //this is really by priority
      this.mapConfig.featureList.sort((a, b): number => {
        if (a.label > b.label) {
          return 1;
        }
        if (a.label < b.label) {
          return -1;
        }
        return 0;
      })
    }
    if (this.sortBy == "Priority") { //this is really by address
      this.mapConfig.featureList.sort((a, b): number => {
        if (a.feature.get('sdate') + ' ' + a.feature.get('stime') > b.feature.get('sdate') + ' ' + b.feature.get('stime')) {
          return 1;
        }
        if (a.feature.get('sdate') + ' ' + a.feature.get('stime') < b.feature.get('sdate') + ' ' + b.feature.get('stime')) {
          return -1;
        }
        return 0;
      })
    }
    if (this.sortBy == "Contractor") {
      this.mapConfig.featureList.sort((a, b): number => {
        if (a.feature.get('company') > b.feature.get('company')) {
          return 1;
        }
        if (a.feature.get('company') < b.feature.get('company')) {
          return -1;
        }
        return 0;
      })
    }
  }
}
