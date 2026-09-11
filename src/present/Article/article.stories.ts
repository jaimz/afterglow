import { element } from "../../stories/fixtures";

export default {
  title: "Present/Article",
  parameters: { controls: { disable: true } },
};

export const Default = () =>
  element(`<article class="ag-article ag-paper" style="max-width:760px">
  <h1>A place for your ideas</h1>
  <p>A collection starts with a few notes. Give each idea a name, add the details that matter, and return to it when you have something new to say.</p>
  <h2>Make room to think</h2>
  <p>Clear headings and comfortable line lengths help readers find their way through a longer document. <a href="#start-small">Start small</a> and let the collection grow.</p>
  <blockquote>Keep the useful details close, and give the rest room to breathe.</blockquote>
  <h3 id="start-small">Start small</h3>
  <ul><li>Write down one observation.</li><li>Connect it to something you already know.</li><li>Leave a question for next time.</li></ul>
  <h4>A familiar rhythm</h4><p>Every section can use ordinary semantic HTML.</p>
  <h5>Returning to a note</h5><p>A smaller heading keeps supporting details in context.</p>
  <h6>One more detail</h6><p>Content remains readable when it grows or the view becomes narrower.</p>
</article>`);

export const EmbeddedControls = () =>
  element(`<article class="ag-article ag-panel" style="max-width:640px">
  <h2>Leave a note</h2><p>Article typography stays scoped to the article's own content.</p>
  <form><label class="ag-body" for="article-note">Your note</label><textarea class="ag-textarea" id="article-note" placeholder="Text area…"></textarea><button class="ag-button" type="reset" style="margin-top:16px">Reset</button></form>
</article>`);
