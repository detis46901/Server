import { Injectable } from '@angular/core';
import { UserPageLayer, MyCubeField } from '_models/layer.model';
import { UserPageInstance, ModuleInstance } from '_models/module.model'
import { Layer } from '_models/layer.model'
import { MapConfig } from 'app/map/models/map.model';
import { PaserConfig } from './paser.model'
//http dependancies
import { HttpClient } from '@angular/common/http'
import { SQLService } from '../../../../_services/sql.service';
import { UserPageLayerService } from '../../../../_services/_userPageLayer.service'
import { LayerService } from '../../../../_services/_layer.service'
import { ModuleInstanceService } from '../../../../_services/_moduleInstance.service'
import VectorLayer from 'ol/layer/Vector';

@Injectable()
export class PaserAdminService {
  public completed: string
  public vectorlayer = new VectorLayer()
  public mapConfig: MapConfig
  public UPL: UserPageLayer
  public filter: string = 'closed IS Null'
  private layer = new Layer
  public newLayerFields: Array<MyCubeField> = [];
  public SDSConfig = new PaserConfig

  constructor(
    protected _http: HttpClient,
    private sqlService: SQLService,
    private userPageLayerService: UserPageLayerService,
    private layerService: LayerService,
    private moduleInstanceService: ModuleInstanceService) {
  }

  public addModuleToPage(userPageInstance: UserPageInstance) {
    let UPL = new UserPageLayer
    UPL.defaultON = true
    userPageInstance.module_instance.settings.properties.forEach((x) => {
      if (x.stringType.name == "myCube Layer Identity (integer)") {
        UPL.layerID = +x.stringType.value
      }
    })
    console.log(UPL)
    UPL.userPageInstanceID = userPageInstance.ID
    UPL.userPageID = userPageInstance.userPageID
    UPL.userID = userPageInstance.userID
    this.layerService.GetSingle(UPL.layerID)
      .subscribe((x: Layer) => {
        UPL.style = x.defaultStyle
        this.userPageLayerService.Add(UPL)
          .subscribe(data => {
            console.log(data)
          })
      })
  }

  public removeModuleFromPage(userPageInstance: UserPageInstance) {
    this.userPageLayerService.GetUserLayers(userPageInstance.userID)
      .subscribe((data: UserPageLayer[]) => {
        data.forEach(x => {
          if (x.userPageInstanceID == userPageInstance.ID) {
            this.userPageLayerService.Delete(x.ID)
              .subscribe((data) => {
              })
          }
        })
      })
  }

  public createModuleInstance(moduleInstance: ModuleInstance) {
    this.layer.layerName = moduleInstance.name
    this.layer.layerDescription = moduleInstance.description
    this.layer.layerGeom = 'None'
    this.layer.layerFormat = 'None'
    this.layer.layerIdent = 'None'
    this.layer.layerService = 'None'
    this.layer.layerType = 'MyCube'
    this.layer.serverID = 0
    this.layer.defaultStyle = JSON.parse('{"load":{"color":"#000000","width":2},"current":{"color":"#000000","width":4},"listLabel": "Name","filter": {}}')
    this.addLayer(moduleInstance)
  }

  public deleteModuleInstance(moduleInstance: ModuleInstance) {
    this.layerService.Delete(moduleInstance.settings['settings'][0]['setting']['value'])
      .subscribe()
    this.sqlService.deleteTable(moduleInstance.settings['settings'][0]['setting']['value'])
      .subscribe()
    this.sqlService.deleteCommentTable(moduleInstance.settings['settings'][0]['setting']['value'])
      .subscribe()
    this.userPageLayerService.GetByLayer(moduleInstance.settings['settings'][0]['setting']['value'])
      .subscribe((x: UserPageLayer[]) => {
        x.forEach((y: UserPageLayer) => {
          y.userPageInstanceID = null
          //need to fix this delete.  It deleted all userpagelayers once!
          // this.userPageLayerService.Delete(y.ID)
          // .subscribe()
        })
      })
  }

  private addLayer(moduleInstance: ModuleInstance): void {
    this.layerService
      .Add(this.layer)
      .subscribe((result: Layer) => {
        this.createTable(result.ID);
        this.updateSettings(result.ID, moduleInstance)
      });
  }

  updateSettings(ID, moduleInstance: ModuleInstance) {
    moduleInstance.settings['settings'][0]['setting']['value'] = ID
    this.moduleInstanceService
      .Update(moduleInstance)
      .subscribe((result) => {
      });
  }

  private createTable(id): void {
    this.sqlService
      .Create(id)
      .subscribe((result: JSON) => {
        Object.keys(this.SDSConfig).forEach((key) => {
          let tempField = new MyCubeField
          tempField.field = key
          console.log(tempField)
          switch (tempField.field) {
            //need to add a case for "ticket" to run this SQL script
            //ALTER TABLE {mycube.table} UNIQUE (ticket)

            case 'ttime': {
              tempField.type = 'date'
              break
            }
            case 'tdate': {
              tempField.type = 'date'
              break
            }
            case 'sdate': {
              tempField.type = 'date'
              break
            }

            default: {
              tempField.type = "text"
            }
          }
          if (tempField.field != 'geom' || 'id') { this.addColumn(id, tempField) }
        });

        this.sqlService
          .setSRID(id)
          .subscribe(() => { })
      })
    this.sqlService
      .CreateCommentTable(id)
      .subscribe();
  }

  private addColumn(id, element): void {
    this.sqlService
      .addColumn(id, element)
      .subscribe((result: string) => {
        console.log(result)
      });
  }
}