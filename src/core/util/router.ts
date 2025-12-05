import GeneratePage from "@/page/GeneratePage.vue";
import IdentifyPage from "@/page/IdentifyPage.vue";
import { createRouter, createWebHistory, type RouterOptions } from "vue-router";

export var publicResource = {
    loadingImage : "loading.jpg",
    loadFailedImage : "failed.jpg",
}

export default createRouter(
    {
        routes : [
            {
                path : "/",
                component : GeneratePage
            },
            {
                path : "/identify",
                component : IdentifyPage
            },
        ],
        history : createWebHistory()
    }
)