import { enhancePaginator, type PaginatorOptions } from "../../behaviors/paginator";
import { element, track } from "../../stories/fixtures";

function render(args: PaginatorOptions) {
  const root = element('<section class="ag-panel" style="padding:24px;max-width:100%;box-sizing:border-box"></section>');
  const nav = element('<nav class="ag-paginator" aria-label="Pagination"></nav>');
  root.append(nav);
  track(enhancePaginator(nav, args));
  return root;
}

export default {
  title: "Interact/Paginator",
  render,
  args: { pageCount: 12, page: 7, variant: "default" },
  argTypes: {
    pageCount: { control: { type: "number", min: 0, step: 1 } },
    page: { control: { type: "number", min: 1, step: 1 } },
    variant: { control: "select", options: ["default", "prev-next"] },
  },
};

export const Default = {};
export const PrevNext = { args: { pageCount: 5, page: 3, variant: "prev-next" } };
export const FirstPage = { args: { pageCount: 5, page: 1, variant: "prev-next" } };
export const LastPage = { args: { pageCount: 5, page: 5, variant: "prev-next" } };
export const SinglePage = { args: { pageCount: 1, page: 1, variant: "prev-next" } };
export const Empty = { args: { pageCount: 0, variant: "prev-next" } };
export const ManyPages = { args: { pageCount: 1000, page: 500 } };

export const WithContent = () => {
  const root = element('<section class="ag-panel ag-body" style="padding:24px;max-width:520px"></section>');
  const title = element('<h2 class="ag-h4" style="margin-top:0">Notebook</h2>');
  const content = element('<ol aria-label="Notes"></ol>') as HTMLOListElement;
  const nav = element('<nav class="ag-paginator" aria-label="Notebook pages"></nav>');
  root.append(title, content, nav);
  const paginator = track(enhancePaginator(nav, { pageCount: 5, variant: "prev-next" }));
  const showPage = (page: number) => {
    content.start = (page - 1) * 3 + 1;
    content.replaceChildren(...Array.from({ length: 3 }, (_, index) => {
      const li = document.createElement("li");
      li.textContent = `Note ${(page - 1) * 3 + index + 1}`;
      return li;
    }));
  };
  nav.addEventListener("ag-page-change", () => showPage(paginator.page));
  showPage(paginator.page);
  return root;
};
WithContent.parameters = { controls: { disable: true } };

export const Layouts = () => {
  const root = element('<section class="ag-panel" style="padding:24px;display:grid;gap:24px"></section>');
  const narrow = element('<div style="max-width:220px"></div>');
  const small = element('<nav class="ag-paginator" aria-label="Narrow pagination"></nav>');
  narrow.append(small);
  track(enhancePaginator(small, { pageCount: 12, page: 7 }));
  const rtl = element('<nav class="ag-paginator" dir="rtl" aria-label="Right-to-left pagination"></nav>');
  track(enhancePaginator(rtl, { pageCount: 5, page: 3, variant: "prev-next" }));
  root.append(narrow, rtl);
  return root;
};
Layouts.parameters = { controls: { disable: true } };
