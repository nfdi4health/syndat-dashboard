from pandas import DataFrame
from pandas.api.types import is_string_dtype

from api.domain import ColumnType

import pandas as pd


def get_column_types(df: DataFrame):
    types_dict = df.dtypes.to_dict()
    column_types = []
    for key, value in types_dict.items():
        # categorical
        if is_string_dtype(value):
            options = df[key].unique().tolist()
            column_types.append(ColumnType(name=key, datatype="object", options=options, minval=None, maxval=None))
        # numerical
        else:
            min_val = df[key].min()
            max_val = df[key].max()
            column_types.append(ColumnType(name=key, datatype=value.name, options=None, minval=min_val, maxval=max_val))
    return column_types


def get_similar_patients(df, constraints):
    intersection = df
    for constraint in constraints:
        if constraint.category is not None:
            result = df[df[constraint.name] == constraint.category]
        else:
            result = df[df[constraint.name].between(constraint.minval, constraint.maxval)]
        intersection = pd.merge(intersection, result, how='inner')
    return intersection
