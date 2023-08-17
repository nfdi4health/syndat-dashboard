from enum import Enum


class ColumnType:
    def __init__(self, name, datatype, options, minval, maxval):
        self.name = name
        self.datatype = datatype
        self.options = options
        self.minval = minval
        self.maxval = maxval


class ColumnConstraint:
    def __init__(self, name, minval, maxval, category):
        self.name = name
        self.minval = minval
        self.maxval = maxval
        self.category = category


class OutlierPredictionMode(Enum):
    isolationForest = "isolation_forest"
    local_outlier_factor = "local_outlier_factor"
