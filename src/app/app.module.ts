//Angular/Miscellaneous
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { MapService } from './map/services/map.service';
import { GeocodingService } from './map/services/geocoding.service';
import { Routes, RouterModule } from '@angular/router';
import { Routing } from './app.routing';
import { BaseRequestOptions } from '@angular/http';
import { AuthGuard } from '../_guards/auth.guard';
import { AdminGuard } from '../_guards/admin.guard';
import { Configuration } from '../_api/api.constants';
import { FilterPipe } from '../_pipes/rowfilter.pipe';
import { PagePipe } from '../_pipes/rowfilter2.pipe';
import { NumFilterPipe } from '../_pipes/numfilter.pipe';

//Angular Material
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatRadioModule } from '@angular/material';
import { MatMenuModule } from '@angular/material';
import { MatIconModule } from '@angular/material';
import { MatDialogModule } from '@angular/material';
import { MatSelectModule } from '@angular/material';
import { MatCheckboxModule } from '@angular/material';
import { MatInputModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material'

//Components
import { LoginComponent } from './user/login.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { AdminNavComponent } from './admin/adminNav/adminNav.component';
import { SettingsNavComponent } from './settings/settingsnav/settingsnav.component';
import { OrganizationComponent } from './admin/organization/organization.component';
import { LayerAdminComponent} from './admin/layerAdmin/layerAdmin.component';
import { LayerPermissionComponent} from './admin/layerAdmin/layerPermission/layerPermission.component';
import { PageComponent} from './admin/user/page/page.component';
import { PageConfigComponent} from './admin/user/pageConfig/pageConfig.component';
import { LayerNewComponent } from './admin/layerAdmin/layerNew/layerNew.component';
import { newMyCubeComponent } from './admin/layerAdmin/myCubeLayer/newMyCube.component';
import { UserComponent } from './admin/user/user.component';
import { AdminPageComponent } from './admin/adminPage/adminPage.component';
import { ModuleComponent } from './admin/module/module.component';
import { DefaultsComponent } from './admin/default/default.component';
import { BoundaryComponent } from './admin/boundary/boundary.component';
import { NotificationComponent } from './admin/notification/notification.component';
import { ServerComponent } from './admin/server/server.component';
import { ConfirmDeleteComponent } from './admin/confirmDelete/confirmDelete.component';
import { SettingsComponent } from './settings/settings.component';
import { UserPageComponent } from './settings/user-pages/user-pages.component';
import { PasswordComponent } from './settings/password/password.component';
import { MarkerDataComponent } from './marker_data/marker-data.component';
import { LayerControlsComponent } from './map/layer-controls/layer-controls.component';
import { ServerNewComponent } from './admin/server/serverNew/serverNew.component';
import { ChangePasswordComponent } from './admin/user/changePassword/changePassword.component';
import { HeaderComponent } from './header/header.component';
import { SideNavComponent } from './sidenav/sidenav.component';
import { FeatureDataComponent } from './sidenav/featuredata.component'
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { MarkerComponent } from '../app/map/marker/marker.component';
import { PMMarkerComponent } from '../app/map/marker/PMmarker.component'
import { NavigatorComponent } from '../app/map/navigator/navigator.component';
import { PagesComponent } from './pages/pages.component';

//Services
import { DepartmentService } from '../_services/_department.service';
import { GroupService } from '../_services/_group.service';
import { RoleService } from '../_services/_role.service';
import { LayerAdminService } from '../_services/_layerAdmin.service';
import { LayerPermissionService } from '../_services/_layerPermission.service';
import { UserPageLayerService } from '../_services/_userPageLayer.service';
import { UserPageService } from '../_services/_userPage.service';
import { AuthenticationService} from '../_services/authentication.service';
import { UserService } from '../_services/_user.service';
import { SQLService } from '../_services/sql.service'
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';



@NgModule ({
    declarations: [
        AppComponent,
        MapComponent,
        MarkerComponent,
        PMMarkerComponent,
        NavigatorComponent,
        PageComponent,
        HeaderComponent,
        SideNavComponent,
        FeatureDataComponent,
        HomeComponent,
        LoginComponent,
        AdminComponent,
        AdminNavComponent,
        SettingsNavComponent,
        OrganizationComponent,
        LayerAdminComponent,
        UserComponent,
        AdminPageComponent,
        SettingsComponent,
        UserPageComponent,
        PasswordComponent,
        FilterPipe,
        NumFilterPipe,
        PagePipe,
        LayerPermissionComponent,
        PageComponent,
        PageConfigComponent,
        LayerNewComponent,
        newMyCubeComponent,
        ConfirmDeleteComponent,
        ModuleComponent,
        DefaultsComponent,
        BoundaryComponent,
        NotificationComponent,
        ServerComponent,
        MarkerDataComponent,
        LayerControlsComponent,
        ServerNewComponent,
        ChangePasswordComponent
    ],

    entryComponents: [
        LayerNewComponent,
        newMyCubeComponent,
        ChangePasswordComponent, 
        LayerPermissionComponent, 
        PageComponent, 
        PageConfigComponent, 
        ConfirmDeleteComponent,
        ServerNewComponent
    ],

    imports: [
        BrowserModule,
        FormsModule,
        CommonModule,
        HttpModule,
        JsonpModule,
        NgbModule.forRoot(),
        Routing,
        RouterModule.forRoot([
            {
                path: 'home',
                component: HomeComponent
            }
        ]),
        BrowserAnimationsModule,
        MatRadioModule,
        MatMenuModule,
        MatIconModule,
        MatDialogModule,
        MatSelectModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatTableModule,
        LeafletModule.forRoot(),
        LeafletDrawModule.forRoot()
    ],

    providers: [
        UserService, 
        MapService, 
        GeocodingService, 
        AuthGuard, 
        AdminGuard, 
        AuthenticationService, 
        UserService, 
        DepartmentService, 
        GroupService, 
        RoleService, 
        LayerAdminService, 
        LayerPermissionService,
        SQLService,
        UserPageLayerService,
        UserPageService,
        Configuration,
        BaseRequestOptions
    ], 

    bootstrap: [AppComponent]
})

export class AppModule {}