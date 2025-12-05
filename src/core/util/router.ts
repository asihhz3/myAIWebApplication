import GeneratePage from "@/page/GeneratePage.vue";
import IdentifyPage from "@/page/IdentifyPage.vue";
import { createRouter, createWebHistory, type RouterOptions } from "vue-router";

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