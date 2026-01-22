import "./HomePage.css";

function HomePage() {
  return (
    <div className="HomePage">
      <section className="card">
        <h3>About</h3>
        <p>
          SYNDAT was developed as part of TA6.4 of the{" "}
          <a href="https://www.nfdi4health.de/">NFDI4Health Initiative</a>. Main
          functionalities include:
        </p>
        <ul>
          <li>Automated, on-demand assesment of synthetic data quality & privacy metrics</li>
          <li>Visualization synthetic & real data relations using low-dimensional embedding plots</li>
          <li>Detection of possible outliers in the synthetic data population</li>
          <li>Visualization of distribution metrics such as violin or correlation plots</li>
        </ul>
        <p>
          We are currently working on extending SYNDAT for synthetic Randomized
          Clinical Trial (RCT) data as part of the{" "}
          <a href="https://www.ihi-synthia.eu/">SYNTHIA Collaboration</a>.
        </p>
      </section>

      <section className="card">
        <h3>Contact</h3>
        <p>
          For any queries, please contact{" "}
          <a href="mailto:holger.fröhlich@scai.fraunhofer.de">Holger Fröhlich</a>.
          <br />
          <br />
          If you find any bugs or have further feature suggestions, feel free to{" "}
          <a href="https://github.com/nfdi4health/syndat-dashboard/issues/new">create an issue</a>{" "}
          on the{" "}
          <a href="https://github.com/nfdi4health/syndat-dashboard">Syndat Github page</a>.
        </p>
      </section>

      <section className="card">
        <h3>How to Use</h3>
        <p>
          You can navigate between two different views using the Input and Results links in the header.
        </p>

        <h4>Input Page</h4>
        <p>
          To input page allows you to upload any set of synthetic and original tabular data and
          shedule it for processing & evaluation. To start, you can upload data using the designated
          upload form. You can select the corresponding files in csv format from your file system{" "}
          <b>(1)</b> and upload them by hitting the "Upload" button <b>(2)</b>. The status of the
          data upload and any errors that might occur during the upload process will be displayed in
          the alert below the upload form <b>(3)</b>. Below the upload form, a badge <b>(4)</b> will
          display the date and time of the last successfull upload.
        </p>
        <img src="home/syndat_tutorial_input_1_2_3_4.png" alt="" />

        <p>
          To process the uploaded data and compute plots & quality metric, you simply have to hit the
          "Trigger result processing" button <b>(5)</b>. Each metric will display a processing status:
          green <b>(6)</b> for finished, orange <b>(7)</b> for pending, and red for failures.
        </p>
        <img src="home/syndat_tutorial_input_5_6_7.png" alt="" />

        <p>
          As a new triggered processing workflow would overwrite the previously computed results, you
          have the option to save the current results under a custom name and retrieve them later.
          Specify a name <b>(8)</b> and hit the "STORE CURRENT RESULT" button <b>(9)</b>.
        </p>
        <img src="home/syndat_tutorial_input_8_9.png" alt="" />

        <h4>Results Page</h4>
        <p>
          The results page will by default display the latest processed results. To access previously
          stored results, use the <b>Dataset</b> dropdown <b>(1)</b>. For an overview of all datasets,
          click the <b>DATASET SUMMARY</b> button <b>(2)</b>.
        </p>
        <img src="home/syndat_tutorial_results_1_2.png" alt="" />

        <p>
          The dashboard displays computed quality and privacy scores. Hover the info icons to see
          metric descriptions. Privacy scores use metrics from anonymeter; see{" "}
          <a href="https://arxiv.org/abs/2211.10459">the paper</a> for details.
        </p>
        <img src="home/syndat_tutorial_results_3_4.png" alt="" />

        <p>
          Inspect a low dimensional 2D embedding of original and synthetic distributions in the
          interactive plot <b>(5)</b>. Toggle the switch <b>(7)</b> to show an outlier view.
        </p>
        <img src="home/syndat_tutorial_results_5_6_7_updated.png" alt="" />

        <p>
          Compare distributions per feature using the feature plot component. Select a feature via the
          dropdown <b>(8)</b> to display violin plots and statistics <b>(9)</b>.
        </p>
        <img src="home/syndat_tutorial_results_8_9.png" alt="" />

        <p>
          Inspect correlations using the correlation plot component and toggle between original and
          synthetic correlations using the switch <b>(10)</b>.
        </p>
        <img src="home/syndat_tutorial_results_10.png" alt="" />
      </section>
    </div>
  );
}
export default HomePage;
