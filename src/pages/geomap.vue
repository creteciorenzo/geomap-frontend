<template>
  <q-layout>
    <q-page-container>
      <q-header elevated>
        <q-toolbar>
          <q-toolbar-title>GeoMap App</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <div class="geomap q-pa-md">
        <div class="row justify-center">
          <div class="col-6">
            <q-card class="my-card bg-grey-1" bordered flat>
              <q-card-section>
                <div class="row no-wrap">
                  <div class="text-h5">Add Marker</div>
                </div>
                <div class="col">
                  <q-input
                    ref="lat"
                    v-model="lat"
                    class="col input"
                    autogrow
                    filled
                    clearable
                    :error="!isLatVal"
                    error-message="Latitude is not valid"
                    hint="Latitude Coordinate"
                  ></q-input>
                </div>
                <div class="col">
                  <q-input
                    ref="long"
                    v-model="long"
                    class="col input"
                    autogrow
                    filled
                    clearable
                    :error="!isLongVal"
                    error-message="Longitude is not valid"
                    hint="Longitude Coordinate"
                  ></q-input>
                </div>
                <div class="col">
                  <q-input
                    ref="input"
                    v-model="details"
                    class="col input"
                    autogrow
                    filled
                    clearable
                    hint="Details"
                  ></q-input>
                </div>
                <div aside>
                  <q-btn
                    :disable="lat === '' || long === '' || details === ''"
                    @click="addMarker(lat, long)"
                    class="btn"
                    color="black"
                    label="Add"
                    rounded
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <l-map :zoom="zoom" :center="center" :options="mapOptions" style="height: 500px">
              <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
              />

              <l-marker
                v-for="(m, i) in markers"
                :key="i"
                :lat-lng="setLatLng(m.coords[0], m.coords[1])"
              >
                <l-icon :icon-size="[32, 32]" :icon-url="icon" />
                <l-popup :options="popupOptions">
                  <q-item class="row" style="font-size: 1rem">
                    <q-item-section class="text-center">{{m.details}}</q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <div class="text-center">
                        <q-btn
                          @click="dialogUpdate(m)"
                          size="md"
                          flat
                          color="positive"
                          icon="edit"
                        />
                        <q-btn
                          @click="dialogDelete(m)"
                          size="md"
                          flat
                          color="negative"
                          icon="delete"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </l-popup>
              </l-marker>
            </l-map>
            <div class="q-pa-md q-gutter-sm">
              <q-dialog v-model="firstDialog">
                <q-card style="width: 400px">
                  <q-card-section>
                    <div class="col">
                      <q-input
                        ref="lat"
                        v-model="draftLat"
                        class="col input"
                        autogrow
                        filled
                        clearable
                        :error="!isLatValid"
                        error-message="Latitude is not valid"
                        hint="Latitude Coordinate"
                      ></q-input>
                    </div>
                    <div class="col">
                      <q-input
                        ref="long"
                        v-model="draftLng"
                        class="col input"
                        autogrow
                        filled
                        clearable
                        :error="!isLongValid"
                        error-message="Longitude is not valid"
                        hint="Longitude Coordinate"
                      ></q-input>
                    </div>
                    <div class="col">
                      <q-input
                        ref="input"
                        v-model="draftDetails"
                        class="col input"
                        autogrow
                        filled
                        clearable
                        hint="Details"
                      ></q-input>
                    </div>
                  </q-card-section>
                  <q-card-actions align="right" class="bg-white text-teal">
                    <q-btn flat label="CANCEL" @click="reset" />
                    <q-btn
                      :disable="draftDetails === '' || draftLat === '' || draftLng === ''"
                      @click="update"
                      color="primary"
                      flat
                      label="UPDATE"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <q-dialog v-model="secondDialog">
                <q-card style="width: 400px">
                  <q-card-section class="q-pt-none" style="padding-top: 3em">
                    <div class="text-center text-h6">Are you sure you want to delete this marker?</div>
                  </q-card-section>

                  <q-card-actions align="right" class="bg-white text-teal">
                    <q-btn flat label="CANCEL" v-close-popup />
                    <q-btn
                      color="negative"
                      flat
                      label="DELETE"
                      v-close-popup
                      @click="deleteMarker"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
          </div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
.input {
  margin: 1em 0;
}
.btn:first-child {
  margin-right: 1em;
}
.popupCustom {
  color: aqua;
}
</style>
<script>
import "leaflet/dist/leaflet.css";
import { latLng } from "leaflet";
import {
  LMap,
  LTileLayer,
  LIcon,
  LMarker,
  LPopup,
  LTooltip
} from "vue2-leaflet";
import { validationLatitudeLongitude } from "validation-latitude-longitude";
export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    LPopup,
    LTooltip
  },
  beforeDestroy() {
    navigator.geolocation.clearWatch(this.positionWatcher);
    this.geomapSrvc.destroy();
  },
  mounted() {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    this.geomapSrvc = this.$dbCon.wingsService("geomap");
    this.geomapSrvc
      .on("dataChange", dataMarkers => {
        this.markers = dataMarkers;
      })
      .init();
  },
  data() {
    return {
      markers: [],
      geomapSrvc: null,
      icon: require("src/assets/marker.png"),
      positionWatcher: null,
      zoom: 5,
      center: latLng(12.8797, 121.774),
      mapOptions: {
        zoomSnap: 0.5
      },
      details: "",
      lat: null,
      long: null,
      isLatVal: true,
      isLongVal: true,
      isLatValid: true,
      isLongValid: true,
      popupOptions: {
        minHeight: 100,
        minWidth: 180
      },
      editingIndex: null,
      draft: "",
      draftDetails: "",
      draftLat: "",
      draftLng: "",
      firstDialog: null,
      secondDialog: null,
      marker: null
    };
  },
  methods: {
    setLocation(pos) {
      const { latitude, longitude } = pos.coords;
      this.center = latLng(latitude, longitude);
    },
    locationError() {},

    setLatLng(lat, lng) {
      return L.latLng(lat, lng);
    },

    addMarker(lat, long) {
      this.isLatVal = validationLatitudeLongitude.latitude(lat);
      this.isLongVal = validationLatitudeLongitude.longitude(long);
      if (this.isLatVal !== true || this.isLongVal !== true) {
        this.$q.notify({
          color: "negative",
          message: "Wrong input"
        });
      } else {
        this.geomapSrvc.create({
          details: this.details,
          coords: [this.lat, this.long]
        });
        this.$q.notify({
          color: "positive",
          message: "Marker added"
        });
      }
      // console.log(this.lat + this.long + this.details);
    },

    update() {
      this.isLatValid = validationLatitudeLongitude.latitude(this.draftLat);
      this.isLongValid = validationLatitudeLongitude.longitude(this.draftLng);
      if (this.isLatValid !== true || this.isLongValid !== true) {
        this.$q.notify({
          color: "negative",
          message: "Coordinates is not valid"
        });
      } else {
        this.geomapSrvc.patch(this.marker._id, {
          details: this.draftDetails,
          coords: [this.draftLat, this.draftLng]
        });
        this.$q.notify({
          color: "positive",
          message: "Success"
        });
        this.isLatValid = true;
        this.isLongValid = true;
        this.firstDialog = false;
      }
    },
    deleteMarker() {
      this.geomapSrvc.remove(this.marker._id, {});
      this.$q.notify({
        color: "positive",
        message: "Success"
      });
    },
    dialogDelete(m) {
      this.marker = m;
      this.secondDialog = true;
    },
    dialogUpdate(m) {
      this.marker = m;
      this.draftLat = this.marker.coords[0];
      this.draftLng = this.marker.coords[1];
      this.draftDetails = this.marker.details;
      this.firstDialog = true;
    },
    reset() {
      this.isLatValid = true;
      this.isLongValid = true;
      this.firstDialog = false;
    }
  }
};
</script>