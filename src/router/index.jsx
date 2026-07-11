// src/routes/router.jsx
import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";

import Layout from "../pages/layouts/Layout.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";

const Home = lazy(() => import("../pages/Home.jsx"));
const Search = lazy(() => import("../pages/Search.jsx"));
const CctvRecord = lazy(() => import("../pages/cctv/CctvRecord.jsx"));
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const FilterCard = lazy(() => import("../pages/BigDamageIssue/FilterCard.jsx"));
const CctvForm = lazy(() => import("../pages/cctv/CctvForm.jsx"));
const Login = lazy(() => import("../pages/auth/Login.jsx"));
const CctvIndex = lazy(() => import("../pages/cctv/CctvIndex.jsx"));
const BigDamageIssue = lazy(
  () => import("../pages/BigDamageIssue/Dashboard.jsx"),
);
const CctvDetails = lazy(() => import("../pages/cctv/CctvDetails.jsx"));
const CctvEdit = lazy(() => import("../pages/cctv/CctvEdit.jsx"));
const AutoLogin = lazy(() => import("../context/AutoLogin.jsx"));
const Demo = lazy(() => import("../pages/requestDiscount/index.tsx"));
const Create = lazy(() => import("../pages/requestDiscount/create.tsx"));
const DamageAdd = lazy(() => import("../pages/BigDamageIssue/DamageAdd.jsx"));
const DamageDetail = lazy(
  () => import("../pages/BigDamageIssue/DamageDetail.jsx"),
);
const DamageView = lazy(() => import("../pages/BigDamageIssue/DamageView.jsx"));
const DamageIssueList = lazy(
  () => import("../pages/BigDamageIssue/DamageIssueList.jsx"),
);
const Detail = lazy(() => import("../pages/requestDiscount/detail.js"));
const IndexPriceChange = lazy(
  () => import("../pages/pricechanges/IndexPriceChange.jsx"),
);
const CreatePriceChange = lazy(
  () => import("../pages/pricechanges/CreatePriceChange.jsx"),
);
const DetailPriceChange = lazy(
  () => import("../pages/pricechanges/DetailPriceChange.jsx"),
);
const IndexPromotionJob = lazy(
  () => import("../pages/promotionjobs/IndexPromotionJob.jsx"),
);
const CreatePromotionJob = lazy(
  () => import("../pages/promotionjobs/CreatePromotionJob.jsx"),
);
const DetailPromotionJob = lazy(
  () => import("../pages/promotionjobs/DetailPromotionJob.jsx"),
);
const MAndE = lazy(() => import("../pages/MAndE/MAndE.jsx"));
const Index = lazy(() => import("../pages/MAndE/Generator/index.js"));
const GeneratorCreate = lazy(
  () => import("../pages/MAndE/Generator/generatorCreate.js"),
);
const GeneratorDetail = lazy(
  () => import("../pages/MAndE/Generator/GeneratorDetail.js"),
);
const GeneratorEdit = lazy(
  () => import("../pages/MAndE/Generator/generatorEdit.js"),
);
const TransformerIndex = lazy(
  () => import("../pages/MAndE/Transformer/transformerIndex.js"),
);
const TransformerCreate = lazy(
  () => import("../pages/MAndE/Transformer/transformerCreate.js"),
);
const TransformerDetail = lazy(
  () => import("../pages/MAndE/Transformer/TransformerDetail.js"),
);
const TransformerEdit = lazy(
  () => import("../pages/MAndE/Transformer/transformerEdit.js"),
);
const SolarIndex = lazy(() => import("../pages/MAndE/Solar/solarIndex.js"));
const SolarCreate = lazy(() => import("../pages/MAndE/Solar/solarCreate.js"));
const SolarDetail = lazy(() => import("../pages/MAndE/Solar/solarDetail.js"));
const SolarEdit = lazy(() => import("../pages/MAndE/Solar/solarEdit.js"));
const EvaIndex = lazy(() => import("../pages/MAndE/Eva/EvaIndex.js"));
const EvaCreate = lazy(() => import("../pages/MAndE/Eva/EvaCreate.js"));
const EvaDetail = lazy(() => import("../pages/MAndE/Eva/EvaDetail.js"));
const EvaEdit = lazy(() => import("../pages/MAndE/Eva/EvaEdit.js"));
const PanelIndex = lazy(() => import("../pages/MAndE/Panel/panelIndex.js"));
const PanelCreate = lazy(() => import("../pages/MAndE/Panel/panelCreate.js"));
const PanelDetail = lazy(() => import("../pages/MAndE/Panel/panelDetail.js"));
const PanelEdit = lazy(() => import("../pages/MAndE/Panel/panelEdit.js"));
const WaterTankIndex = lazy(() => import("../pages/MAndE/WaterTank/Index.js"));
const WaterTankCreate = lazy(
  () => import("../pages/MAndE/WaterTank/Create.js"),
);
const WaterTankDetail = lazy(
  () => import("../pages/MAndE/WaterTank/Detail.js"),
);
const WaterTankEdit = lazy(() => import("../pages/MAndE/WaterTank/Edit.js"));
const HandoverIndex = lazy(() => import("../pages/handover/HandoverIndex.js"));
const HandoverEdit = lazy(() => import("../pages/handover/HandoverEdit.js"));
const HandoverCreate = lazy(
  () => import("../pages/handover/HandoverCreate.js"),
);
const HandoverDetail = lazy(
  () => import("../pages/handover/HandoverDetail.js"),
);

const lazyElement = (Component) => (
  <Suspense
    fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}
  >
    <Component />
  </Suspense>
);
const LoginRoute = () => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" /> : lazyElement(Login);
};

const BigDamageRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/big-damage-issue-add/${id}`} replace />;
};
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginRoute />,
  },
  {
    path: "/auto-login",
    element: lazyElement(AutoLogin),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: lazyElement(Dashboard),
      },
      {
        path: "home",
        element: lazyElement(Home),
      },
      {
        path: "create",
        element: lazyElement(Create),
      },
      {
        path: "search",
        element: lazyElement(Search),
      },
      {
        path: "big_damage_issue",
        element: lazyElement(BigDamageIssue),
      },
      {
        path: "big-damage-issue-add",
        element: lazyElement(DamageAdd),
      },
      {
        path: "big-damage-issue-add/:id",
        element: lazyElement(DamageView),
      },
      {
        path: "big-damage-issue-detail/:id",
        element: lazyElement(DamageDetail),
      },
      {
        // Redirect notifications from underscore style to the correct URL format
        path: "big_damage_issue_detail/:id",
        element: <BigDamageRedirect />,
      },
      {
        path: "big-damage-issue-filter",
        element: lazyElement(FilterCard),
      },
      {
        path: "big-damage-issue-datalist",
        element: lazyElement(DamageIssueList),
      },
      {
        path: "cctv-request",
        element: lazyElement(CctvRecord),
      },
      {
        path: "cctv-form",
        element: lazyElement(CctvForm),
      },
      {
        path: "cctv_record",
        element: lazyElement(CctvIndex),
      },
      {
        path: "cctv-details/:id",
        element: lazyElement(CctvDetails),
      },
      {
        path: "cctv-edit/:id",
        element: lazyElement(CctvEdit),
      },
      {
        path: "request_discount",
        element: lazyElement(Demo),
      },
      {
        path: "request-discount-create",
        element: lazyElement(Create),
      },
      {
        path: "request_discount_detail/:id",
        element: lazyElement(Detail),
      },
      {
        path: "m_and_e",
        element: lazyElement(MAndE),
      },
      {
        path: "generator/:id",
        element: lazyElement(Index),
      },
      {
        path: "generator_create",
        element: lazyElement(GeneratorCreate),
      },
      {
        path: "me_generator_detail/:id",
        element: lazyElement(GeneratorDetail),
      },
      {
        path: "generator_edit/:id",
        element: lazyElement(GeneratorEdit),
      },

      {
        path: "transformer/:id",
        element: lazyElement(TransformerIndex),
      },
      {
        path: "transformer_create",
        element: lazyElement(TransformerCreate),
      },
      {
        path: "me_transformer_detail/:id",
        element: lazyElement(TransformerDetail),
      },
      {
        path: "transformer_edit/:id",
        element: lazyElement(TransformerEdit),
      },
      {
        path: "solar/:id",
        element: lazyElement(SolarIndex),
      },
      {
        path: "solar_create",
        element: lazyElement(SolarCreate),
      },
      {
        path: "me_solar_detail/:id",
        element: lazyElement(SolarDetail),
      },
      {
        path: "solar_edit/:id",
        element: lazyElement(SolarEdit),
      },

      {
        path: "evaporator/:id",
        element: lazyElement(EvaIndex),
      },
      {
        path: "evaporator_create",
        element: lazyElement(EvaCreate),
      },
      {
        path: "me_evaporator_detail/:id",
        element: lazyElement(EvaDetail),
      },
      {
        path: "evaporator_edit/:id",
        element: lazyElement(EvaEdit),
      },

      {
        path: "panel/:id",
        element: lazyElement(PanelIndex),
      },
      {
        path: "panel_create",
        element: lazyElement(PanelCreate),
      },
      {
        path: "me_panel_detail/:id",
        element: lazyElement(PanelDetail),
      },
      {
        path: "panel_edit/:id",
        element: lazyElement(PanelEdit),
      },

      {
        path: "water-tank/:id",
        element: lazyElement(WaterTankIndex),
      },

      {
        path: "water-tank/create",
        element: lazyElement(WaterTankCreate),
      },

      {
        path: "water-tank-detail/:id",
        element: lazyElement(WaterTankDetail),
      },
      {
        path: "water-tank/edit/:id",
        element: lazyElement(WaterTankEdit),
      },
      {
        path: "price_changes",
        element: lazyElement(IndexPriceChange),
      },
      {
        path: "price_changes/create",
        element: lazyElement(CreatePriceChange),
      },
      {
        path: "price_changes_detail/:id",
        element: lazyElement(DetailPriceChange),
      },
      {
        path: "promotion_jobs",
        element: lazyElement(IndexPromotionJob),
      },
      {
        path: "promotion_jobs/create",
        element: lazyElement(CreatePromotionJob),
        // element: <PromotionJobRunner />,
      },
      {
        path: "promotion_jobs_detail/:id",
        element: lazyElement(DetailPromotionJob),
      },
      {
        path: "handover",
        element: lazyElement(HandoverIndex),
      },
      {
        path: "handover/create",
        element: lazyElement(HandoverCreate),
      },
      {
        path: "handover_detail/:id",
        element: lazyElement(HandoverDetail),
      },
      {
        path: "handover_edit/:id",
        element: lazyElement(HandoverEdit),
      },
    ],
  },
]);

export default router;
