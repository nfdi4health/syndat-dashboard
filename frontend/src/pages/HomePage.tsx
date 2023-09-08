import { Container } from "react-bootstrap";
import "./HomePage.css";

function HomePage() {
  return (
    <Container>
      <h1>Syndat</h1>
      <h2>
        A Dashboard for evaluation & visualization of synthetic patient level
        data
      </h2>
      <h3>About</h3>
      <p>
        SYNDAT is a was developed as part of TA6.4 of the{" "}
        <a href="https://www.nfdi4health.de/">NFDI4Health Initiative</a>. Main
        functionalities include:
      </p>
      <ul>
        <li>
          Automated, on-demand assesment of synthetic data quality & privacy
          metrics
        </li>
        <li>
          Visualization synthetic & real data relations using low-dimensional
          embedding plots
        </li>
        <li>Detection of possible outliers in the synthetic data population</li>
        <li>
          Visualization of distribution metrics such as violin or correlation
          plots
        </li>
        <li>
          Filtering of synthetic data & on-demand generation of synthetic data
          points
        </li>
      </ul>
      <p>
        The Dashboard consists of a frontend module for user interaction and
        data visualization as well as a backend module for direct API access.
        You can access the API page with the corresponding API documentation by
        clikcing the API Version link in the upper right corner of the page
        header.
      </p>
      <h3>Contact</h3>
      <p>
        For any queries, please contact{" "}
        <a href="mailto:holger.fröhlich@scai.fraunhofer.de">Holger Fröhlich</a>.{" "}
        <br />
        <br />
        If you find any bugs or have further feature suggestions, feel free to{" "}
        <a href="https://github.com/nfdi4health/syndat-dashboard/issues/new">
          create an issue
        </a>{" "}
        on the{" "}
        <a href="https://github.com/nfdi4health/syndat-dashboard">
          Syndat Github page
        </a>
        .
      </p>
      <h3>How to Use</h3>
      <p>
        You can navigate between two different views using the Input and Results
        Link in the Home page header.
      </p>
      <h4>Input Page</h4>
      <p>
        To input page allows you to upload any set of synthetic and original
        tabular data and shedule it for processing & evaluation. To start, you
        can upload data using the designated upload form. You can select the
        corresponding files in csv format from your file system <b>(1)</b> and
        upload them by hitting the "Upload" button <b>(2)</b>. The status of the
        data upload and any errors that might occur during the upload process
        will be displayed in the alert below the upload form <b>(3)</b>. This
        will be either a blue message when the upload is pending, a green
        success message after a successfull upload or an red error message with
        details about the failed upload process. Below the upload form, a badge{" "}
        <b>(4)</b> will display the date and time of the last successfull
        upload. The uploaded data will be stored as the "default" current
        dataset, any processing triggers will be applied to this dataset.
      </p>
      <img src="home/syndat_tutorial_input_1_2_3_4.png" alt=""></img>
      <p>
        To process the uploaded data and compute plots & quality metric, you
        simply have to hit the "Trigger result processing" button <b>(5)</b>.
        This will asynchronously trigger the result processing in the backend
        for each computed metric. The results will be displayed on the Results
        Page as the "default" dataset soon as the processing is finished. Each
        metric will display a processing status that will turn green <b>(6)</b> as
        soon as the processing is finished. A pending processing status will be
        displayed in orange <b>(7)</b>. A red error message will be displayed
        for a failed process specifiying details about the error and how to fix
        them based on the input data. This may for example occur if the input
        data is not complete or contains invalid values or column labels.
      </p>
      <img src="home/syndat_tutorial_input_5_6_7.png" alt=""></img>
      <p>
        As a new triggered processing workflow would overwrite the previously
        computed results, you have the option to save the current results under
        a custom name and retrieve them using the dataset dropdown in the
        results page. To do this, simply specify a name for your dataset{" "}
        <b>(8)</b> and hit the "STORE CURRENT RESULT" button <b>(9)</b> in the
        results storage form.
      </p>
      <img src="home/syndat_tutorial_input_8_9.png" alt=""></img>
      <h4>Results Page</h4>
      <p>
        The results page will by default display the latest processed results.
        To access previously stored results, you can use the <b>Dataset</b>{" "}
        Dropdown at the top of the page <b>(1)</b>. if you want an overwiev of
        the quality results of all processed & saved datasets, you can click the{" "}
        <b>DATASET SUMMARY</b> button <b>(2)</b>:
      </p>
      <img src="home/syndat_tutorial_results_1_2.png" alt=""></img>
      <p>
        The next component displays the computed quality & privacy of the
        synthetic data. Both the privacy scores <b>(3)</b> and quality scores{" "}
        <b>(4)</b> use three different distinct metrics to compute a score that
        can be used to evaluate the synthetic data. The info boxes below each of
        the score displays can be hovered over to display a tooltip with more
        information about each respective metric. The privacy scores use
        implemented metrics by anonymeter, for implementation details please
        refer to <a href="https://arxiv.org/abs/2211.10459">their papaer</a>.
      </p>
      <img src="home/syndat_tutorial_results_3_4.png" alt=""></img>
      <p>
        You can inspect a low dimensional 2D embedding of the original and
        synthetic data distribution on the interactive patient plot component{" "}
        <b>(5)</b>. The component allows you to inspect the general distribution
        of the data, as well as manually inspect individual synthetic data
        points by clicking them in the plot and hitting the <b>Inspect</b>{" "}
        button <b>(6)</b>. The general view of the component can be switched to
        an "outlier" view by toggling the switch <b>(7)</b> above the plot. The
        outlier view displays a heatmap scoring of each synthetic data point,
        depicting the propability that the respective data point is likely to be
        an outlier, given the rest of the synthetic data. The outlier score is
        derived by applying the Isolation Forest algorithm on the synthetic
        data.
      </p>
      <img src="home/syndat_tutorial_results_5_6_7.png" alt=""></img>
      <p>
        You can also compare the original with the synhetic patient distribution
        for each individual feature using the feature plot component. Using the
        dropdown <b>(8)</b> you can select the feature you want to inspect. The
        feature plot component will then display a violin plot <b>(9)</b> and
        general distribution statistics of the original and synthetic data
        distribution for the selected feature <b>(9)</b> in case of a numerical
        feature or a barplot in case of a categorical feature.
      </p>
      <img src="home/syndat_tutorial_results_8_9.png" alt=""></img>
      <p>
        It is also possible to inspect the correlations between the different
        features using the correaltion plot component. The correlation plot can
        be toggled to switch between the feature correlations of the original
        and synthetic data using the switch <b>(10)</b> on top of the component.
      </p>
      <img src="home/syndat_tutorial_results_10.png" alt=""></img>
      <p>
        Using the last component of the results page, it is possible to filter
        synthetic patients for specific characteristics and return a number of
        similar synthetic patients that should match the specified
        characteristics. To filter the synthetic data, value ranges can be
        specified for numerical features by adjusting the sliders <b>(11)</b> to
        the desired range. For categorical features, the desired values can be
        choosen by selecting the corresponding value in the dropdown compoennt{" "}
        <b>(12)</b>. By hitting the "submit" button <b>(13)</b>, a list of
        synthetic patients will be rendered below the form that match the
        desired patient characteristics.
      </p>
      <img src="home/syndat_tutorial_results_11_12_13.png" alt=""></img>
    </Container>
  );
}
export default HomePage;
