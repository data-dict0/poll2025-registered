// Function to get current dimensions based on container width
function getDimensions() {
    const container = d3.select("#voters_2025").node();
    const containerWidth = container.getBoundingClientRect().width;
    const isMobile = containerWidth < 768;
    
    const margin = {
        top: 40,
        right: isMobile ? 60 : 120,
        bottom: 20,
        left: isMobile ? 120 : 200
    };
    
    // Set dimensions with increased height
    const width = containerWidth;
    const height = 1000; // Increased to 15000px
    
    return {
        margin,
        width,
        height,
        isMobile
    };
}

// Modified number formatting function to add plus sign
const formatNumber = (value) => {
    const formatted = d3.format(",")(value);
    return value > 0 ? "+" + formatted : formatted;
};

// Create responsive SVG
function createResponsiveSvg() {
    const dims = getDimensions();
    
    // Clear existing SVG
    d3.select("#voters_2025 svg").remove();
    
    // Create new SVG
    const svg = d3.select("#voters_2025")
        .append("svg")
        .attr("width", dims.width)
        .attr("height", dims.height)
        .append("g")
        .attr("transform", `translate(${dims.margin.left},${dims.margin.top})`);
    
    return svg;
}

// Create scales with responsive dimensions
function createScales(dims) {
    const width = dims.width - dims.margin.left - dims.margin.right;
    const height = dims.height - dims.margin.top - dims.margin.bottom;
    
    const y = d3.scaleBand()
        .range([0, height])
        .padding(0.3);
        
    const x = d3.scaleLinear()
        .range([0, width]);
        
    return { x, y, width, height };
}

// Function to update the chart with transitions
function updateChart(data, selectedCategory) {
    const dims = getDimensions();
    const svg = createResponsiveSvg();
    const { x, y, width, height } = createScales(dims);
    
    const fontSize = dims.isMobile ? "12px" : "14px";
    const axisFontSize = dims.isMobile ? "12px" : "14px";
    
    const filteredData = data.filter(d => d.province === selectedCategory);
    
    y.domain(filteredData.map(d => d.municipality));
    x.domain([
        Math.min(0, d3.min(filteredData, d => d.change_from_2019)),
        Math.max(0, d3.max(filteredData, d => d.change_from_2019))
    ]);
    
    // Add x-axis at the top with formatted numbers including plus signs
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,0)`)
        .call(d3.axisTop(x)
            .ticks(dims.isMobile ? 3 : 5)
            .tickSize(0)
            .tickFormat(d => formatNumber(d)))
        .style("font-size", axisFontSize)
        .style("font-family", "Roboto")
        .select(".domain").remove();
    
    const yAxis = svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .style("font-size", axisFontSize)
        .style("font-family", "Roboto")
        .call(d3.axisLeft(y)
        .tickSize(0)
        .tickPadding(20)
        .ticks(4))
        .selectAll('path')
        .style("stroke-width", "0px");
    
    svg.selectAll("line.vertical-grid")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "vertical-grid")
        .attr("x1", function (d) {return x(d);})
        .attr("y1", 0)
        .attr("x2", function (d) {return x(d);})
        .attr("y2", height)
        .style("stroke", "gray")
        .style("stroke-width", 1)
    
    if (dims.isMobile) {
        yAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-15)")
    }
    
    const bars = svg.selectAll(".bar")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("fill", d => d.change_from_2019 >= 0 ? "#5aae61" : "#9970ab")
        .attr("y", d => y(d.municipality))
        .attr("height", y.bandwidth())
        .attr("x", d => x(Math.min(0, d.change_from_2019)))
        .attr("width", 0)
        .transition()
        .duration(750)
        .attr("width", d => Math.abs(x(d.change_from_2019) - x(0)));
    
    // Modified labels with updated positioning - positive at end, negative at start
    const labels = svg.selectAll(".value-label")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("y", d => y(d.municipality) + y.bandwidth() / 2)
        .attr("x", d => {
            const padding = dims.isMobile ? 3 : 5;
            if (d.change_from_2019 >= 0) {
                return x(d.change_from_2019) + padding;  // Positive values at end
            } else {
                return x(0) + padding;  // Negative values at start
            }
        })
        .attr("text-anchor", d => d.change_from_2019 >= 0 ? "start" : "end")
        .attr("dy", "0.35em")
        .style("font-size", fontSize)
        .style("paint-order", "stroke")
        .style("stroke", "white")
        .style("stroke-width", "3px")
        .style("stroke-linecap", "butt")
        .style("stroke-linejoin", "miter")
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1)
        .text(d => formatNumber(d.change_from_2019));
}

function styleDropdown(select) {
    select
        .style("display", "block")
        .style("width", "100%")
        .style("max-width", "400px")
        .style("margin", "10px 0")
        .style("padding", "8px")
        .style("font-size", "16px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("background-color", "#fff");
}

// Initialize the chart
d3.csv('data/voters.csv').then(function(data) {
    data.forEach(d => {
        d.change_from_2019 = +d.change_from_2019;
    });
    
    const categories = [...new Set(data.map(d => d.province))];
    
    const select = d3.select("#voters_2025")
        .insert("select", "svg")
        .attr("id", "categorySelect");
    
    styleDropdown(select);
    
    select.selectAll("option")
        .data(categories)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    updateChart(data, categories[0]);
    
    select.on("change", function() {
        updateChart(data, this.value);
    });
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateChart(data, select.property("value"));
        }, 250);
    });
}).catch(function(error) {
    console.error('Error loading the data:', error);
});

const style = document.createElement('style');
style.textContent = `
    #voters_2025 {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
    }
    
    @media (max-width: 768px) {
        .x-axis text {
            font-size: 12px;
            font-family: "Roboto";
        }
        
        .y-axis text {
            font-size: 12px;
            font-family: "Roboto";
        }
    }
`;
document.head.appendChild(style);