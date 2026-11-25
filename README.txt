TOPA / TOPAH WEBSITE: plain HTML, CSS and JavaScript
=====================================================

No installs and no build tools. Double-click index.html to view the site in your browser.

FILES
  index.html            Home page
  about.html            About, vision & mission, timeline, founder
  programmes.html       The 6 programmes
  products.html         Product catalogue (15 products + chia range)
  impact.html           Impact & results
  gallery.html          Photo gallery with lightbox
  get-involved.html     Ways to get involved + form
  contact.html          Contact details, form, map, FAQ
  404.html              "Page not found" page
  assets/css/style.css  All styling (colours are at the top, under :root)
  assets/js/main.js     All animations and interactions
  assets/img/           Photos (WebP), logo (assets/img/brand/), icons
  contact.php           Sends form messages to info@topaorganicuganda.org (needs PHP hosting)
  .htaccess             HTTPS, redirects from old site URLs, caching (Apache/cPanel; hidden file)
  sitemap.xml, robots.txt, site.webmanifest

EDITING
  Open any .html file in a text editor (VS Code, Notepad++, etc.) and change the text.
  The header and footer are repeated in every page. If you change a phone number,
  use Find & Replace across all .html files.
  To change a photo, put the new image in assets/img/ and update the src="" (and srcset="") of that <img>.
  To add a product, copy one <article class="product ..."> block in products.html and edit it.

GOING LIVE (cPanel)
  1. Back up and remove the old WordPress files from public_html.
  2. Upload everything in this folder (including the hidden .htaccess) to public_html.
  3. In Google Search Console, submit https://topaorganicuganda.org/sitemap.xml

When the site is opened from your computer (not a web server), the contact forms open your email
app instead of sending directly. Once uploaded to PHP hosting, they send directly.
